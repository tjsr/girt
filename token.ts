import * as commander from "commander";

import { getAuthTokenAsString } from "./auth.js";

export const tokenCommand = ():commander.Command => {
  const token = new commander.Command("token");

  token.description("Retrive the currently set token from the GitHub CLI.")
    .action(async (_options, command: commander.Command) => {
      try {
        const token: string|undefined = await getAuthTokenAsString();
        if (token) {
          console.log(token);
          return;
        } else {
          command.error('No token return from `gh auth token` command.', { exitCode: 4, code: 'girt.login.no_token' })
        }
      } catch (err: any) {
        command.error('Failed executing `gh auth token` command. ' + err.message, { exitCode: 3, code: 'girt.login.token_cmd_failed' });
      }
    });
  return token;
};
