import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import external from "rollup-plugin-peer-deps-external";
import dts from "rollup-plugin-dts";
import postcss from "rollup-plugin-postcss";
import autoprefixer from "autoprefixer";
import "rollup-plugin-export-default";
import sass from "node-sass";
import pkg from "./package.json";

const packageJson = require("./package.json");

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: packageJson.main,
                format: "cjs",
                sourcemap: true,
                name: "react-lib",
                exports: "named",
            },
            {
                file: packageJson.module,
                format: "esm",
                sourcemap: true,
                exports: "named",
            },
        ],
        plugins: [
            external(),
            resolve(),
            commonjs({ defaultIsModuleExports: false }),
            typescript({ tsconfig: "./tsconfig.json" }),
            postcss({
                preprocessor: (content, id) =>
                    new Promise((res) => {
                        const result = sass.renderSync({ file: id });

                        res({ code: result.css.toString() });
                    }),
                plugins: [autoprefixer],
                modules: {
                    scopeBehaviour: "global",
                },
                sourceMap: true,
                extract: true,
                inject: true,
            }),
            terser(),
        ],
        external: [...Object.keys(pkg.peerDependencies || {})],
    },
    {
        input: "dist/esm/index.d.ts",
        output: [{ file: "dist/index.d.ts", format: "esm" }],
        external: [/\.s?css$/],
        plugins: [dts()],
    },
];
