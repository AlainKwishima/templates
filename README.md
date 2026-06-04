# NE Templates

This repository is a collection of reusable project templates and starter kits maintained in one place.
Each top-level folder is a separate template or sample project with its own stack, conventions, and README.

## What is inside

- `FEMS/` - Fire Extinguisher Management System, a full-stack microservice template for fire safety operations.
- `Final_Rest_Microservise_Template/` - REST microservices starter with shared packages, gateway, and multiple services.
- `Final_Rest_Template/` - REST backend template with modular structure, auth, users, departments, resources, and reporting.
- `Final_java_template/` - Java-based full-stack template with frontend and Spring/Java backend structure.
- `Java_Template/` - Spring Boot template with authentication, user management, notifications, and Swagger.
- `Mobile_Template/` - Mobile app template built around an Expo/React Native style structure.
- `Restful_Microservice_Template/` - REST microservice starter with shared packages, gateway, auth, file, and user services.
- `Restful_Template/` - RESTful full-stack template with backend and frontend applications.
- `face-mqtt-servo/` - Face recognition, MQTT, and ESP8266 servo control project.

## How to use this repo

1. Open the folder for the template you want to work on.
2. Read that project's own `README.md` or setup docs.
3. Install dependencies and run it using the commands from that template.
4. Keep changes inside the relevant template folder unless you intentionally want to update the shared workspace.

## Notes

- This repository contains multiple independent projects, so there is no single build or run command at the root.
- Some subprojects already include package locks, migrations, generated assets, and sample environment files.
- Do not commit secrets. Use the provided `.env.example` files as the starting point for local configuration.

## Contributing

If you update a template, keep its local documentation in sync so future users can start from the folder without guesswork.
