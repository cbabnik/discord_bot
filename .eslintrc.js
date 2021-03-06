module.exports = {
    "env": {
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2019
    },
    "rules": {
        "indent": [
            "error",
            4
        ],
        "brace-style": [
            "error",
            "1tbs"
        ],
        "linebreak-style": [
            "error"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "curly": [
            "error",
            "all"
        ],
        "keyword-spacing": [
            "error"
        ],
        "no-constant-condition": [
            "off"
        ],
        "space-in-parens": [
            "error",
            "always",
            { "exceptions": ["empty"] }
        ],
        "prefer-const": [
            "error",
            { "destructuring": "all" }
        ]
    }
};