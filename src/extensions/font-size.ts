import { Extension } from "@tiptap/core";
import "@tiptap/extension-text-style";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        fontsize: {
            setFontSize: (size: string) => ReturnType
            unsetFontSize: () => ReturnType
        }
    }
}

export const FontSizeExtension = Extension.create({
    name: "fontsize",
    addOptions() {
        return {
            types: ["textStyle"],
        }
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontsize: {
                        default: null,
                        parseHTML: element => element.style.fontSize ? element.style.fontSize : null,
                        renderHTML: attributes => {
                            if (!attributes.fontsize) {
                                return {};
                            }
                            return { style: `font-size: ${attributes.fontsize}` };
                        }
                    }
                }
            }
        ]
    },
    addCommands() {
        return {
            setFontSize: (fontSize: string) => ({ chain }) => {
                return chain()
                    .setMark("textStyle", { fontsize: fontSize })
                    .run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark("textStyle", { fontsize: null })
                    .removeEmptyTextStyle()
                    .run();
            }
        }
    },
})