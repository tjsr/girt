import { exec } from "child_process";

export const getAuthTokenAsString = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      exec("gh auth token", (error, stdout, _stderr) => {
        if (error) {
          return reject(error);
        }
        return resolve(stdout.trim());  
      });
      // You can now use the token variable as needed
    } catch (error) {
      reject(error);
    }
  });
};
