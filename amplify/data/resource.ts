// amplify/data/resource.ts
import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  User: a
    .model({
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.email().required(),
      status: a.enum(["pending", "confirmed", "suspended"]).default("pending"),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Campos opcionais para mais informações
      phone: a.phone(),
      avatar: a.url(),
      preferences: a.json(),
    })
    .authorization((allow) => [
      allow.owner(), // Usuário pode acessar seus próprios dados
      allow.groups(["admin"]), // Admins podem acessar tudo
    ]),

  // Exemplo de outros modelos que você pode precisar
  UserProfile: a
    .model({
      userId: a.id().required(),
      bio: a.string(),
      website: a.url(),
      location: a.string(),
      birthDate: a.date(),
      user: a.belongsTo("User", "userId"),
    })
    .authorization((allow) => [allow.owner(), allow.groups(["admin"])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
