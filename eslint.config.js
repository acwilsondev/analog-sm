export default [
  {
    files: ["**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../infra/*", "../../infra/*", "src/infra/*"],
              message: "UI and domain layers must not import infrastructure directly."
            }
          ]
        }
      ]
    }
  }
];
