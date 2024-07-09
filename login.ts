import * as commander from "commander";

import { execSync } from "child_process";
import { getAuthTokenAsString } from "./auth.js";

export const loginCommand = ():commander.Command => {
  const login = new commander.Command("login");

  login.description("Login using a sequence of 'gh login' commands and get token.")
    .option("-s, --skip-token", "Skip checking for the presence of a token before calling login")
    .action(async (options, command: commander.Command) => {
      command.showHelpAfterError();
      let token: string|undefined = undefined;
      if (!options['skipToken']) {
        try {
          token = await getAuthTokenAsString();
          if (token) {
            command.error('Token already set. Skipping login.  Use \'-s\' switch to skip token check.',
              { code: 'girt.login.token_already_set', exitCode: 5 });
            return;
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          command.error('Failed executing `gh auth token` command. ' +
            err.message, { code: 'girt.login.token_cmd_failed', exitCode: 3 });
        }
      }

      execSync("gh auth login", { stdio: 'inherit' });

      try {
        token = await getAuthTokenAsString();
        if (token) {
          console.log(token);
          return;
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        command.error('Failed executing `gh auth token` command. ' +
          err.message, { code: 'girt.login.token_cmd_failed', exitCode: 3 });
      }
    });
  return login;
};
