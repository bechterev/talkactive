import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Application mask conferences api',
    version: '1.0.0',
  },
  servers: [{
    url: 'http://localhost:3000',
  }],
  security: [{
    bearerAuth: [],
  }],
};

const options:swaggerJSDoc.Options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./**/user.ts', './**/room.ts', './**/auth.ts', './**/device.ts', './**/refreshtoken.ts'],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
