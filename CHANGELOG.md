# Changelog

## [0.3.1](https://github.com/DrWheelicus/questrade-mcp-server/compare/v0.3.0...v0.3.1) (2026-04-07)


### Bug Fixes

* **docker:** skip prepare hook during Docker build npm ci ([#11](https://github.com/DrWheelicus/questrade-mcp-server/issues/11)) ([c742412](https://github.com/DrWheelicus/questrade-mcp-server/commit/c7424123bdfd2c381e6e45b504d605a7010343fc))

## [0.3.0](https://github.com/DrWheelicus/questrade-mcp-server/compare/v0.2.0...v0.3.0) (2026-04-07)


### Features

* add config validation and structured logging ([0657650](https://github.com/DrWheelicus/questrade-mcp-server/commit/0657650ecf909e24fc6959df14504ea6a9a47abb))
* add MCP server with dual stdio/HTTP transport ([0ac9853](https://github.com/DrWheelicus/questrade-mcp-server/commit/0ac9853129021e9057d57985da96865807654e48))
* add OAuth token manager with encrypted storage ([70ba021](https://github.com/DrWheelicus/questrade-mcp-server/commit/70ba02136cacf8ba82fd0059d0e47f3cbc4c802d))
* add portfolio, market data, and order tools ([9371b19](https://github.com/DrWheelicus/questrade-mcp-server/commit/9371b1983d4e3a4221e39dfa40eae9435c2fffa4))
* add Questrade API type definitions ([618abf4](https://github.com/DrWheelicus/questrade-mcp-server/commit/618abf42c02927377beb8eaa1c2385b851a0b8df))
* add Questrade HTTP client with rate limiting ([58e0abd](https://github.com/DrWheelicus/questrade-mcp-server/commit/58e0abd7169f990942033a7325ec5dbd02cb75f5))
* replace hand-rolled logger with pino ([105396b](https://github.com/DrWheelicus/questrade-mcp-server/commit/105396bcce39f5af7b9fbae36188e61b82c9cf0c))
* scaffold project with TypeScript and MCP SDK ([4f3ae59](https://github.com/DrWheelicus/questrade-mcp-server/commit/4f3ae59e37c29b3c20d7d4244af88fba8ce1d2ca))


### Bug Fixes

* **ci:** remove component prefix from release tags ([#9](https://github.com/DrWheelicus/questrade-mcp-server/issues/9)) ([06b787c](https://github.com/DrWheelicus/questrade-mcp-server/commit/06b787c21b610ce4625f300321201c632d6b6f63))
* remove OAuth base URL from error logs (CWE-312/532) ([#4](https://github.com/DrWheelicus/questrade-mcp-server/issues/4)) ([58f74d6](https://github.com/DrWheelicus/questrade-mcp-server/commit/58f74d625b83d828aae6da37b63a0901cf472a76))
* stop logging OAuth base URL to resolve CWE-312/532 alerts ([58f74d6](https://github.com/DrWheelicus/questrade-mcp-server/commit/58f74d625b83d828aae6da37b63a0901cf472a76))


### Documentation

* add README with setup and usage instructions ([60f21d7](https://github.com/DrWheelicus/questrade-mcp-server/commit/60f21d76f992f8c376d7b3d215f0174ff6da8d8a))
* enhance README with Security Policy and Release Process sections ([0089690](https://github.com/DrWheelicus/questrade-mcp-server/commit/0089690304fd8254264a05696b3d1ffb84cce5f7))
* update README with additional setup instructions and troubleshooting tips ([48b1cec](https://github.com/DrWheelicus/questrade-mcp-server/commit/48b1ceccbe976fd59870221403de0ba9ba50dd5c))
* update README with corrected Windows config path and additional note for MSIX installs ([8505878](https://github.com/DrWheelicus/questrade-mcp-server/commit/8505878069004cbdfb02d0721424e0c63f633121))
* update README with revised device token generation steps and security warning ([d6ab587](https://github.com/DrWheelicus/questrade-mcp-server/commit/d6ab58734ff48d12309d07e519a241201316cff6))

## [0.2.0](https://github.com/DrWheelicus/questrade-mcp-server/compare/questrade-mcp-server-v0.1.0...questrade-mcp-server-v0.2.0) (2026-04-07)


### Features

* add config validation and structured logging ([0657650](https://github.com/DrWheelicus/questrade-mcp-server/commit/0657650ecf909e24fc6959df14504ea6a9a47abb))
* add MCP server with dual stdio/HTTP transport ([0ac9853](https://github.com/DrWheelicus/questrade-mcp-server/commit/0ac9853129021e9057d57985da96865807654e48))
* add OAuth token manager with encrypted storage ([70ba021](https://github.com/DrWheelicus/questrade-mcp-server/commit/70ba02136cacf8ba82fd0059d0e47f3cbc4c802d))
* add portfolio, market data, and order tools ([9371b19](https://github.com/DrWheelicus/questrade-mcp-server/commit/9371b1983d4e3a4221e39dfa40eae9435c2fffa4))
* add Questrade API type definitions ([618abf4](https://github.com/DrWheelicus/questrade-mcp-server/commit/618abf42c02927377beb8eaa1c2385b851a0b8df))
* add Questrade HTTP client with rate limiting ([58e0abd](https://github.com/DrWheelicus/questrade-mcp-server/commit/58e0abd7169f990942033a7325ec5dbd02cb75f5))
* replace hand-rolled logger with pino ([105396b](https://github.com/DrWheelicus/questrade-mcp-server/commit/105396bcce39f5af7b9fbae36188e61b82c9cf0c))
* scaffold project with TypeScript and MCP SDK ([4f3ae59](https://github.com/DrWheelicus/questrade-mcp-server/commit/4f3ae59e37c29b3c20d7d4244af88fba8ce1d2ca))


### Bug Fixes

* remove OAuth base URL from error logs (CWE-312/532) ([#4](https://github.com/DrWheelicus/questrade-mcp-server/issues/4)) ([58f74d6](https://github.com/DrWheelicus/questrade-mcp-server/commit/58f74d625b83d828aae6da37b63a0901cf472a76))
* stop logging OAuth base URL to resolve CWE-312/532 alerts ([58f74d6](https://github.com/DrWheelicus/questrade-mcp-server/commit/58f74d625b83d828aae6da37b63a0901cf472a76))


### Documentation

* add README with setup and usage instructions ([60f21d7](https://github.com/DrWheelicus/questrade-mcp-server/commit/60f21d76f992f8c376d7b3d215f0174ff6da8d8a))
* enhance README with Security Policy and Release Process sections ([0089690](https://github.com/DrWheelicus/questrade-mcp-server/commit/0089690304fd8254264a05696b3d1ffb84cce5f7))
* update README with additional setup instructions and troubleshooting tips ([48b1cec](https://github.com/DrWheelicus/questrade-mcp-server/commit/48b1ceccbe976fd59870221403de0ba9ba50dd5c))
* update README with corrected Windows config path and additional note for MSIX installs ([8505878](https://github.com/DrWheelicus/questrade-mcp-server/commit/8505878069004cbdfb02d0721424e0c63f633121))
* update README with revised device token generation steps and security warning ([d6ab587](https://github.com/DrWheelicus/questrade-mcp-server/commit/d6ab58734ff48d12309d07e519a241201316cff6))
