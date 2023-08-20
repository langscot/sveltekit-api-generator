import fs from "fs";
import path from "path";
import { ExportedDeclarations, JSDoc, Project, SyntaxKind } from "ts-morph";
import { getTypeScriptReader, getOpenApiWriter, makeConverter } from "typeconv";
import type { Method, RouteMap } from "../types.js";

/**
 * Gets an array of all file paths that match the given name in the given directory, recursively.
 * @param directoryPath The directory path to search in
 * @param name The file name to search for
 * @returns An array of file paths that match the given name
 */
export function getFilesOfName(directoryPath: string, name: string) {
    const directory = fs.readdirSync(directoryPath);
    let filePaths: string[] = [];

    directory.forEach((fileName) => {
        const filePath = path.join(directoryPath, fileName);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // Recurse into subdirectory
            filePaths = filePaths.concat(getFilesOfName(filePath, name));
        } else if (stats.isFile() && fileName.endsWith(name)) {
            filePaths.push(path.join(directoryPath, fileName));
        }
    });

    return filePaths;
}

/**
 * Intelligently gets the return type of a function declaration.
 * @param declaration Function declaration
 * @returns Return type of the function
 */
export function getReturnTypeFromDeclaration(
    declaration: ExportedDeclarations
) {
    const returnStatements = declaration.getDescendantsOfKind(
        SyntaxKind.ReturnStatement
    );

    let types: string[] = [];

    if (returnStatements.length === 0) return false;

    returnStatements.forEach((returnStatement) => {
        const callExpression = returnStatement.getFirstDescendantByKind(
            SyntaxKind.CallExpression
        );

        if (!callExpression) return false;

        const functionName = callExpression
            .getFirstDescendantByKind(SyntaxKind.Identifier)
            ?.getText();

        if (!functionName || functionName !== "json") return false;

        const firstArgument = callExpression.getArguments();

        if (firstArgument.length < 1) return false;

        types.push(firstArgument[0].getType().getText());
    });

    return types.length ? types.join(" | ") : false;
}

/**
 * Gets all query parameter usages from a given declaration, by
 * looking at url.searchParams.get() and url.searchParams.getAll() calls.
 * @param declaration Declaration to look in
 * @returns An array of strings, each string being a query parameter name
 */
export function getQueryParameterUsageFromDeclaration(
    declaration: ExportedDeclarations
) {
    return (
        declaration
            .getDescendantsOfKind(SyntaxKind.CallExpression)
            // Isolate only callExpression's that are url.searchParams.get() or url.searchParams.getAll()
            .filter((call) => {
                const expression = call.getExpression();
                if (!expression) return false;
                const expressionText = expression.getText();
                return [
                    "url.searchParams.get",
                    "url.searchParams.getAll",
                ].includes(expressionText);
            })
            // Isolate only calls that have at least one argument
            .filter((call) => call.getArguments().length > 0)
            // Get the text of the first argument
            .map((call) => {
                // Get the first argument
                const firstArgument = call.getArguments()[0];
                // Get the text of the first argument
                const firstArgumentText = firstArgument.getText();
                return firstArgumentText.replace(/['"]/g, "");
            })
    );
}

/**
 * Gets the body type tag comment from a given array of JSDoc comments.
 * @param comments The array of JSDoc comments
 * @returns The body type tag comment, if any
 */
export function getBodyTypeFromComments(comments: JSDoc[]) {
    let bodyType: string | undefined = undefined;

    comments.forEach((comment) => {
        const bodyTag = comment
            .getTags()
            .find((tag) => tag.getTagName() === "body");
        if (bodyTag) bodyType = bodyTag.getComment()?.toString();
    });

    return bodyType;
}

/**
 * Gets all possible valid URL combinations from a given file name. This is mostly
 * concerned with SvelteKit's dynamic routing, using optional params like [[param]]
 * which yields 2 possible combinations
 * @param fileName The file name to get the URLs from
 * @returns Array of URLs
 */
export function getUrlsFromFileName(fileName: string) {
    // Remove /+server.ts
    let route = calculateRelativeApiUrlFromPath(fileName);

    function generateRecursive(
        routeSegments: string[],
        index: number,
        currentSegments: string[],
        combinations: string[]
    ) {
        if (index >= routeSegments.length) {
            combinations.push(currentSegments.join("/"));
            return;
        }

        const segment = routeSegments[index];
        if (segment.startsWith("[") && segment.endsWith("]")) {
            const isOptional =
                segment.startsWith("[[") && segment.endsWith("]]");

            if (isOptional) {
                generateRecursive(
                    routeSegments,
                    index + 1,
                    currentSegments,
                    combinations
                );
            }

            const newSegments = currentSegments.concat(
                `{${segment.replace(/[\[\]]/g, "")}}`
            );
            generateRecursive(
                routeSegments,
                index + 1,
                newSegments,
                combinations
            );
        } else {
            const newSegments = currentSegments.concat(segment);
            generateRecursive(
                routeSegments,
                index + 1,
                newSegments,
                combinations
            );
        }
    }

    const routeSegments = route.split("/");
    const combinations: string[] = [];
    generateRecursive(routeSegments, 0, [], combinations);
    return combinations;
}

/**
 * Given a url like '/users/{id}', find the first segment before the first param
 * @param url The url to get the segment from
 * @returns The segment before the first param
 */
export function getFirstSegmentBeforeParam(url: string) {
    const segments = url.split("/");
    const index = segments.findIndex((segment) => segment.startsWith("{"));
    return index > 0 ? segments[index - 1] : segments[segments.length - 1];
}

/**
 * Capitalizes the first letter of a string.
 * @param str The string to capitalize
 */
export function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Removes the JS comment syntax like "//", "/*", and "* /", "*" from a given string.
 * @param comment
 * @returns
 */
export function getTextFromComment(comment: string) {
    comment = comment
        .replace(/\/\//g, "")
        .replace(/\/\*/g, "")
        .replace(/\*\//g, "")
        .replace(/\*/g, "");
    // Remove @body { ... }
    comment = comment.replace(/@body\s*{[^}]*}/g, "");

    return comment.trim();
}

/**
 * Gets the OpenAPI schema from a given TypeScript type.
 * This is super hacky! It uses typeconv to convert the type to JSON schema,
 * then parses the JSON schema to get the OpenAPI schema. In the future,
 * we should write our own converter from TypeScript types to OpenAPI Schema.
 * @param type The type to get the OpenAPI schema for
 */
export async function getOpenAPISchemaFromTSType(type: string) {
    const reader = getTypeScriptReader();
    const writer = getOpenApiWriter({
        format: "json",
        version: "",
        title: "",
    });
    const { convert } = makeConverter(reader, writer);
    const data = JSON.parse(
        (await convert({ data: `export type Response = ${type}` })).data
    );
    return data.components.schemas.Response;
}

export function generateRouteMap(root: string) {
    // Get all server files
    const files = getFilesOfName(root, "+server.ts");

    // Create a new project and add the files
    const project = new Project({
        tsConfigFilePath: path.join(root, "tsconfig.json"),
    });

    // Create a route map
    const routes: RouteMap = {};

    // Loop through each file and gather necessary information about the routes
    // it implements.
    files.forEach((file) => {
        const sourceFile = project.addSourceFileAtPath(file);

        // Get all JS docs
        const jsDocComments = sourceFile.getDescendantsOfKind(SyntaxKind.JSDoc);

        sourceFile.getExportedDeclarations().forEach((declarations, method) => {
            // Only handle API exports
            if (!["GET", "POST", "PUT", "DELETE"].includes(method)) return;

            // If nothing declared, return
            if (declarations.length === 0) return;
            const declaration = declarations[0];

            // Get the type of declaration
            const type = declaration.getType().getText();

            // Attempt to get the return type, based on sveltekit's json() usage
            const returnType =
                getReturnTypeFromDeclaration(declaration) || "any";

            // Get the JSDoc comment, if any
            const comments = jsDocComments.filter((comment) => {
                const commentEndLine = comment.getEndLineNumber();
                const declarationStartLine = declaration.getStartLineNumber();
                return commentEndLine === declarationStartLine - 1;
            });

            // Get the @input jsdoc tag if present
            const bodyType = getBodyTypeFromComments(comments);

            // Find all 'url.searchParams.get()' and 'url.searchParams.getAll()' calls
            const queryParameters =
                getQueryParameterUsageFromDeclaration(declaration);

            // Add to route map
            if (!routes[file]) routes[file] = {};

            routes[file][method as Method] = {
                method: method as Method,
                type,
                returnType,
                jsDoc:
                    comments.map((comment) => comment.getText()).join("\n") ||
                    undefined,
                queryParameters,
                bodyType,
                urls: getUrlsFromFileName(file),
                path: calculateRelativeApiUrlFromPath(file),
            };
        });
    });

    return routes;
}

/**
 * Gets relative API url from a given filename
 */
export function calculateRelativeApiUrlFromPath(file: string) {
    // It's posix
    if (file.startsWith("/")) {
        return path
            .normalize(file)
            .replace(/.*src\/routes/, "")
            .replace(/\/\+server\.ts$/, "");
    } else {
        return path
            .normalize(file)
            .replaceAll("\\", "/")
            .replace(/.*src\/routes/, "")
            .replace(/\/\+server\.ts$/, "");
    }
}
