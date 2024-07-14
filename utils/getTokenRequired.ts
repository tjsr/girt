import * as commander from "commander";

import { TokenCommandOption } from "../types.js";
import { requireOption } from "./options.js";

export const getTokenRequired = (command: commander.Command, options?: TokenCommandOption): string|never => {
  if (!options) {
    options = command.optsWithGlobals();
  }
  const token = command.optsWithGlobals()['token'] || options?.token || process.env['GITHUB_TOKEN'];
  try {
    requireOption(token, 'token');
  } catch (err: any) {
    command.showHelpAfterError();
    command.error('Token must be provided via GITHUB_TOKEN environment var or command option. ' +
      err.message, { code: 'GIRT.NO_TOKEN', exitCode: 2 });
  }
  return token;
};
