kmake is a meta-build-tool for C/C++ projects similar in its functionality to
premake and cmake.
It is an extended fork of Node.js so it provides the speed of V8 and all of the
Node.js-API to kmake-build-scripts.

For when you are only changing TypeScript and/or JavaScript files without also doing changes to the native side, clone this repo and with your normal kmake binary do:

`kmake --dev absolute/path/to/kmake_repo`

For when you are changing TypeScript and/or JavaScript files to create a node build that pulls them in at runtime, build with the following command:

Windows: `vcbuild.bat openssl-no-asm without-intl node-builtin-modules-path %cd%`

\*nix based: `./configure --openssl-no-asm --without-intl --node-builtin-modules-path $(pwd)`
