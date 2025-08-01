"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ern_core_1 = require("ern-core");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const { execp } = ern_core_1.childProcess;
const MavenUtils_1 = __importDefault(require("./MavenUtils"));
class MavenPublisher {
    get name() {
        return 'maven';
    }
    get platforms() {
        return ['android'];
    }
    publish({ containerPath, containerVersion, url, extra, }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!extra) {
                extra = {};
            }
            if (!extra.artifactId) {
                ern_core_1.log.debug(`Using default artifactId: ${MavenPublisher.DEFAULT_ARTIFACT_ID}`);
                extra.artifactId = MavenPublisher.DEFAULT_ARTIFACT_ID;
            }
            if (!extra.groupId) {
                ern_core_1.log.debug(`Using default groupId: ${MavenPublisher.DEFAULT_GROUP_ID}`);
                extra.groupId = MavenPublisher.DEFAULT_GROUP_ID;
            }
            if (!url) {
                ern_core_1.log.debug(`Using default url: ${MavenPublisher.DEFAULT_URL}`);
                url = MavenPublisher.DEFAULT_URL;
            }
            url = MavenUtils_1.default.processUrl(url);
            if (MavenUtils_1.default.isLocalMavenRepo(url)) {
                MavenUtils_1.default.createLocalMavenDirectoryIfDoesNotExist(url);
            }
            fs_1.default.appendFileSync(path_1.default.join(containerPath, 'lib', 'build.gradle'), `
apply plugin: 'maven-publish'

task androidSourcesJar(type: Jar) {
    archiveClassifier = 'sources'
    from android.sourceSets.main.java.srcDirs
}

artifacts {
    archives androidSourcesJar
}

publishing {
    publications {
        release(MavenPublication) {
            afterEvaluate {
                groupId = "${extra.groupId}"
                artifactId = "${extra.artifactId}"
                version = "${containerVersion}"
                from components.release
                artifact tasks.androidSourcesJar
            }
        }
    }

${MavenUtils_1.default.targetRepositoryGradleStatement(url, {
                mavenPassword: extra && extra.mavenPassword,
                mavenUser: extra && extra.mavenUser,
            })}
  }`);
            try {
                ern_core_1.log.info('[=== Starting build and publication ===]');
                ern_core_1.shell.pushd(containerPath);
                yield this.buildAndUploadArchive();
                ern_core_1.log.info('[=== Completed build and publication of the Container ===]');
                ern_core_1.log.info(`[Publication url : ${url}]`);
                ern_core_1.log.info(`[Artifact: ${extra.groupId}:${extra.artifactId}:${containerVersion} ]`);
            }
            finally {
                ern_core_1.shell.popd();
            }
        });
    }
    buildAndUploadArchive() {
        return __awaiter(this, void 0, void 0, function* () {
            const gradlew = /^win/.test(process.platform) ? 'gradlew' : './gradlew';
            return execp(`${gradlew} publish`);
        });
    }
}
exports.default = MavenPublisher;
MavenPublisher.DEFAULT_ARTIFACT_ID = 'local-container';
MavenPublisher.DEFAULT_GROUP_ID = 'com.walmartlabs.ern';
MavenPublisher.DEFAULT_URL = `file:${path_1.default.join(os_1.default.homedir() || '', '.m2', 'repository')}`;
//# sourceMappingURL=index.js.map