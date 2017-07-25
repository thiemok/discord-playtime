/* eslint-disable */

require('babel-polyfill');
//require('isomorphic-fetch');

require('babel-register')({
	presets: ['es2015', 'stage-0'],
	plugins: [
		'add-module-exports',
		[
			"babel-plugin-module-alias", [
				{ "src": "./lib/tools", "expose": "tools" },
				{ "src": "./constants", "expose": "constants" },
			],
			"flow-runtime", {
				"assert": true,
				"annotate": true
			}
		]
	]
});

require('./app/index');
