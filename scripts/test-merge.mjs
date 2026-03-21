// import { cx } from './src/shared/lib/utils/cn.ts'; 
// Since we can't easily run TS directly without setup, I will manually reconstruct the logic in this script using 'tailwind-merge' import that node can verify.
// Wait, I can't import .ts file in node directly without ts-node.
// I will copy-paste the logic into this test script.

import clsx from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": [
                {
                    text: [
                        "display-lg", "display-md", "display-sm", "display-xs", "display-xxs",
                        "heading-lg", "heading-md", "heading-sm",
                        "label-lg", "label-md", "label-sm", "label-xs",
                        "body-lg", "body-md", "body-sm", "body-xs",
                    ],
                },
            ],
            "border-color": [
                {
                    border: [
                        "neutral-primary", "neutral-secondary", "neutral-tertiary", "neutral-disable", "neutral-white", "neutral-strong",
                        "brand", "brand-light", "brand-dark",
                        "success", "success-subtle",
                        "danger", "danger-subtle",
                        "warning", "warning-subtle",
                        "input",
                    ],
                },
            ],
            "text-color": [
                {
                    text: [
                        "foreground-primary", "foreground-secondary", "foreground-tertiary", "foreground-disable", "foreground-on-color",
                        "brand", "brand-light", "brand-dark",
                    ],
                },
            ],
        },
    },
})

function cx(...args) {
    return customTwMerge(clsx(...args))
}

const result1 = cx("text-label-md text-foreground-on-color");
const result2 = cx("text-foreground-on-color text-label-md");
const result3 = cx("border border-neutral-primary");
const result4 = cx("border-neutral-primary border");

console.log("Test 1 (Label first):", result1);
console.log("Test 2 (Color first):", result2);
console.log("Test 3 (Border border-color):", result3);
console.log("Test 4 (Border-color border):", result4);

if (result1.includes("text-foreground-on-color") && result1.includes("text-label-md")) {
    console.log("PASS: Text classes preserved");
} else {
    console.log("FAIL: Text classes stripped");
}
