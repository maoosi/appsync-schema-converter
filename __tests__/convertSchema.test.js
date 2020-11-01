const { AppSyncScalars, convertSchemas } = require("..");

const baseSchema = `
"""
type description
"""
type Query {
  "field description"
  testBaseQuery: String
}

"this is a mutation"
type Mutation {
  testMutation: String
}
`;

const extendedSchema = `
extend type Query {
  """
  description on extended type
  """
  testExtendQuery: String
}

type Subscription {
  testUpdate: String
  @aws_subscribe(mutations: ["testMutation"])
}
`;

it("converts literal descriptions into comment descriptions.", () => {
  const schema = convertSchemas(baseSchema, { commentDescriptions: true });

  expect(/# type description/.test(schema) && /# field description/.test(schema)).toBe(true);
});

it("merges type extensions into the original definition.", () => {
  const schema = convertSchemas([baseSchema, extendedSchema], { commentDescriptions: true });

  expect(/type Query \{[^\}]+# description on extended type\n\s+testExtendQuery\: String\s+\}/ms.test(schema)).toBe(
    true,
  );
});

it("retains AppSync scalar in the resuling schema.", () => {
  const scalars = AppSyncScalars.map(s => s.replace("scalar ", "")).map(
    scalar => scalar.replace("AWS", "").toLowerCase() + ": " + scalar,
  );

  const schema = convertSchemas([
    baseSchema,
    `
    extend type Query {
      ${scalars.join("\n")}
    }
  `,
  ]);

  expect(scalars.every(scalar => schema.indexOf(scalar) > -1)).toBe(true);
});

it("retains AppSync authorization directives in the resulting schema.", () => {
  const schema = convertSchemas(
    `type Query @aws_api_key @aws_iam @aws_oidc @aws_cognito_user_pools {
      foo: String
    }`,
    { includeDirectives: true },
  );

  expect(/@aws_api_key @aws_iam @aws_oidc @aws_cognito_user_pools/.test(schema)).toBe(true);
});
