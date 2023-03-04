"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Options = void 0;
const GraphicsApi_1 = require("kmake/GraphicsApi");
const Architecture_1 = require("kmake/Architecture");
const AudioApi_1 = require("kmake/AudioApi");
const VrApi_1 = require("kmake/VrApi");
const VisualStudioVersion_1 = require("kmake/VisualStudioVersion");
const Compiler_1 = require("kmake/Compiler");
exports.Options = {
    precompiledHeaders: false,
    intermediateDrive: '',
    graphicsApi: GraphicsApi_1.GraphicsApi.Default,
    architecture: Architecture_1.Architecture.Default,
    audioApi: AudioApi_1.AudioApi.Default,
    vrApi: VrApi_1.VrApi.None,
    compiler: Compiler_1.Compiler.Default,
    visualStudioVersion: VisualStudioVersion_1.VisualStudioVersion.VS2022,
    followSymbolicLinks: true,
    compile: false,
    run: false,
    cores: 1,
    debug: false,
    outputIntermediateSpirv: false
};
//# sourceMappingURL=Options.js.map