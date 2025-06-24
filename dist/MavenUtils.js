"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const ern_core_1 = require("ern-core");
const HOME_DIRECTORY = os_1.default.homedir();
const FILE_REGEX = /^file:\/\/(.*)/;
class MavenUtils {
    static mavenRepositoryType(mavenRepositoryUrl) {
        if (mavenRepositoryUrl.startsWith('http')) {
            return 'http';
        }
        else if (mavenRepositoryUrl.startsWith('file')) {
            return 'file';
        }
        return 'unknown';
    }
    /**
     *  Build repository statement to be injected in Android build.gradle for publication target of generated container
     * @param mavenRepositoryUrl
     * @returns {string}
     */
    static targetRepositoryGradleStatement(mavenRepositoryUrl, { mavenUser, mavenPassword, } = {}) {
        const repoType = this.mavenRepositoryType(mavenRepositoryUrl);
        if (repoType === 'file') {
            // Replace \ by \\ for Windows
            return `
    repositories {
        maven {
            url = "${mavenRepositoryUrl.replace(/\\/g, '\\\\')}"
        }
    }`;
        }
        else if (repoType === 'http') {
            // User can pass userName as "value" or variable [mavenUser]
            const isMavenUserVar = mavenUser && mavenUser.lastIndexOf('[') === 0;
            // User can pass password as "value" or variable [mavenPassword]
            const isMavenPwdVar = mavenPassword && mavenPassword.lastIndexOf('[') === 0;
            let authBlock = '';
            // Check if mavenUser or mavenPassword is to be appended as variable in the authentication bean
            if (isMavenUserVar || isMavenPwdVar) {
                authBlock = `
            credentials {
                username = "${mavenUser.slice(1, -1)}"
                password = "${mavenPassword.slice(1, -1)}"
            }`;
            } // Check if mavenUser or mavenPassword is to be appended as value in the authentication bean
            else if (mavenUser || mavenPassword) {
                authBlock = `
            credentials {
                username = "${mavenUser}"
                password = "${mavenPassword}"
            }`;
            }
            // --config '{"mavenUser": "myUser","mavenPassword": "myPassword"}'
            // Result :
            // repositories {
            //   maven {
            //     url = "http://domain.name:8081/repositories"
            //     credentials {
            //       username = "myUser"
            //       password = "myPassword"
            //     }
            //   }
            // }
            // --config '{"mavenUser": "[myUserVar]","mavenPassword": "[myPasswordVar]”}'
            // Result :
            // repositories {
            //   maven {
            //     url = "http://domain.name:8081/repositories"
            //     credentials {
            //       username = myUserVar
            //       password = myPasswordVar
            //     }
            //   }
            // }
            // no config
            // Result :
            // repositories {
            //   maven {
            //     url = "http://domain.name:8081/repositories"
            //   }
            // }
            // trim() to remove AuthBlock empty line when not needed.
            const mavenRepository = `url = "${mavenRepositoryUrl}"${authBlock}`.trim();
            return `
    repositories {
        maven {
            ${mavenRepository}
        }
    }`;
        }
    }
    static isLocalMavenRepo(repoUrl) {
        if (repoUrl && FILE_REGEX.test(repoUrl)) {
            return true;
        }
        return false;
    }
    static createLocalMavenDirectoryIfDoesNotExist(repoUrl) {
        const dir = FILE_REGEX.exec(repoUrl)[1];
        if (!fs_1.default.existsSync(dir)) {
            ern_core_1.log.debug(`Local Maven repository directory does not exist, creating one.`);
            ern_core_1.shell.mkdir('-p', dir);
        }
        else {
            ern_core_1.log.debug(`Local Maven repository directory already exists`);
        }
    }
    static processUrl(repoUrl) {
        repoUrl = repoUrl.replace('file:~', `file:${os_1.default.homedir() || ''}`);
        repoUrl = repoUrl.replace('file://~', `file://${os_1.default.homedir() || ''}`);
        repoUrl = repoUrl.replace(/\${([^}]+)}/g, (match, vars) => {
            const envVariables = vars ? vars.split('|') : [];
            for (const e of envVariables) {
                if (process.env[e]) {
                    return process.env[e];
                }
            }
            return 'undefined';
        });
        return repoUrl;
    }
}
exports.default = MavenUtils;
MavenUtils.getDefaultMavenLocalDirectory = () => path_1.default.join(HOME_DIRECTORY, '.m2', 'repository');
MavenUtils.getDefaultMavenLocalUrl = () => `file://${MavenUtils.getDefaultMavenLocalDirectory()}`;
//# sourceMappingURL=MavenUtils.js.map