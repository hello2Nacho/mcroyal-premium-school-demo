const { Config } = require('@remotion/cli/config');

// Psychovisual RD spends bits on photo texture; turning it off keeps the
// scroll under 15MB at the same CRF 18.
Config.overrideFfmpegCommand(({ args }) => {
  const i = args.indexOf('libx264');
  if (i === -1) return args;
  return [...args.slice(0, i + 1), '-x264-params', 'psy-rd=0.0,0.0', ...args.slice(i + 1)];
});
