import { GraphicsApi } from 'kmake/GraphicsApi';
import { Architecture } from 'kmake/Architecture';
import { AudioApi } from 'kmake/AudioApi';
import { VrApi } from 'kmake/VrApi';
import { VisualStudioVersion } from 'kmake/VisualStudioVersion';
import { Compiler } from 'kmake/Compiler';

export let Options = {
	precompiledHeaders: false,
	intermediateDrive: '',
	graphicsApi: GraphicsApi.Default,
	architecture: Architecture.Default,
	audioApi: AudioApi.Default,
	vrApi: VrApi.None,
	compiler: Compiler.Default,
	ccPath: '',
	cxxPath: '',
	arPath: '',
	visualStudioVersion: VisualStudioVersion.VS2022,
	followSymbolicLinks: true,
	compile: false,
	run: false,
	cores: 1,
	debug: false,
	outputIntermediateSpirv: false
};
