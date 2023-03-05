import factory from "./factory.js";
try {
  await factory.initialize();
} catch (error) {
  console.error({ error });
}
