<!-- README template from https://github.com/othneildrew/Best-README-Template -->

<a name="readme-top"></a>

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![Contributors][contributors-shield]][contributors-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <!-- <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a> -->

  <h3 align="center">SvelteKit API Generator (Vite Plugin)</h3>
  <ul align="left">
    <li>Generates an OpenAPI schema from your SvelteKit API endpoints (`+server.ts` files)</li>
    <li>Provides a Swagger UI</li>
    <li>Generates a type safe client library for your API</li>
  </ul>
  <p align="center">
    <br />
    <a href="https://github.com/exactstate/sveltekit-api-generator"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/exactstate/sveltekit-api-generator">View Demo</a>
    ·
    <a href="https://github.com/exactstate/sveltekit-api-generator/issues">Report Bug</a>
    ·
    <a href="https://github.com/exactstate/sveltekit-api-generator/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <!-- <li><a href="#contact">Contact</a></li> -->
    <!-- <li><a href="#acknowledgments">Acknowledgments</a></li> -->
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

<!-- [![Product Name Screen Shot][product-screenshot]](https://example.com) -->

The main goal of this project is to provide type-safety for SvelteKit's API endpoints which can be defined in `+server.ts` files. This project will generate an OpenAPI schema from your API endpoints and provide a Swagger UI to explore your API. It will also generate a type-safe client library for your API. **This is achieved by using a Vite plugin.**

This project is still in the early stages of development. It is not yet ready for production use. Please feel free to contribute!

The inspiration for this project came from my codebase increasingly relying on SvelteKit's API endpoints for fetching mostly JSON data. Similar to SvelteKit's `PageData` for `load` functions, I wanted "automatic" type safety for my API endpoints. In addition, as my codebase grows in size, I wanted to use Swagger UI to explore my API endpoints without manually defining an OpenAPI schema.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

-   [![Vite][Vite.js]][Vite-url]
-   [![TS Morph][Ts-morph.dev]][Ts-morph-url]
-   [![Swagger UI][Swagger-tools]][Swagger-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

A vite plugin is used to generate the OpenAPI schema and client library. The plugin will also serve the Swagger UI.

### Prerequisites

-   Create a SvelteKit project, if not already existing
    ```sh
    npm create svelte@latest
    ```
-   Use TypeScript to define your `+server.ts` files in your SvelteKit project

### Installation

1. Install the plugin
    ```sh
    npm install --save-dev vite-plugin-sveltekit-api-generator
    ```
2. Add the plugin to your `vite.config.ts` file

    ```ts
    import { defineConfig } from 'vite';
    import svelte from '@sveltejs/vite-plugin-svelte';
    import sveltekitApiGenerator from 'vite-plugin-sveltekit-api-generator';

    // https://vitejs.dev/config/
    export default defineConfig({
        plugins: [svelte(), sveltekitApiGenerator()],
    });
    ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

Upon running `npm run dev`, the vite plugin will:

1. Generate an OpenAPI schema from your `+server.ts` files, and serve it at `http://localhost:5173/swagger-ui.json`
2. Generate a type-safe client library for your API and create it at `src/lib/api.ts`
3. Serve the Swagger UI at `http://localhost:5173/swagger-ui`

### What endpoints are type safe?

Only endpoints that make use of SvelteKit's `json()` helper function will have type safety for the response body. For example, the following endpoint will have type safety for the response body:

```ts
export async function GET({ params }) {
    const { id } = params;
    const user: {
        id: number;
        name: string;
    } = await getUser(id);
    return json(data);
}
```

If you do not use the `json()` helper function, the response will be typed as `any`.

### What else is type safe?

If you use `url.searchParams.get()` or `url.searchParams.getAll()`, the OpenAPI schema will include query parameters.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->

## Roadmap

-   [ ] Add route parameters to OpenAPI schema
-   [ ] Add type safety for `request.formData()` and `request.json()` usage
-   [ ] Redesign API client to leverage types with a smaller, generic runtime
-   [ ] Add tests

See the [open issues](https://github.com/exactstate/sveltekit-api-generator/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

<!-- ## Acknowledgments

<p align="right">(<a href="#readme-top">back to top</a>)</p> -->

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[repo-url]: https://github.com/exactstate/sveltekit-api-generator
[contributors-shield]: https://img.shields.io/github/contributors/exactstate/sveltekit-api-generator.svg?style=for-the-badge
[contributors-url]: https://github.com/exactstate/sveltekit-api-generator/graphs/contributors
[stars-shield]: https://img.shields.io/github/stars/exactstate/sveltekit-api-generator.svg?style=for-the-badge
[stars-url]: https://github.com/othneildrew/Best-README-Template/stargazers
[issues-shield]: https://img.shields.io/github/issues/exactstate/sveltekit-api-generator.svg?style=for-the-badge
[issues-url]: https://github.com/exactstate/sveltekit-api-generator/issues
[license-shield]: https://img.shields.io/github/license/exactstate/sveltekit-api-generator.svg?style=for-the-badge
[license-url]: https://github.com/exactstate/sveltekit-api-generator/blob/main/LICENSE.txt
[Svelte.dev]: https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[Vite.js]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vitejs.dev/
[Ts-morph.dev]: https://img.shields.io/badge/TS%20Morph-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[Ts-morph-url]: https://ts-morph.com/
[Swagger-tools]: https://img.shields.io/badge/Swagger%20UI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black
[Swagger-url]: https://swagger.io/tools/swagger-ui/
