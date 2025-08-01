import { ContainerPublisher } from 'ern-container-publisher'
import { shell, childProcess, log, NativePlatform } from 'ern-core'
import fs from 'fs'
import path from 'path'
import os from 'os'
const { execp } = childProcess
import MavenUtils from './MavenUtils'

export default class MavenPublisher implements ContainerPublisher {
  public static readonly DEFAULT_ARTIFACT_ID: string = 'local-container'
  public static readonly DEFAULT_GROUP_ID: string = 'com.walmartlabs.ern'
  public static readonly DEFAULT_URL: string = `file:${path.join(
    os.homedir() || '',
    '.m2',
    'repository'
  )}`

  get name(): string {
    return 'maven'
  }

  get platforms(): NativePlatform[] {
    return ['android']
  }

  public async publish({
    containerPath,
    containerVersion,
    url,
    extra,
  }: {
    containerPath: string
    containerVersion: string
    url?: string
    extra?: {
      artifactId?: string
      groupId?: string
      mavenPassword?: string
      mavenUser?: string
    }
  }): Promise<any> {
    if (!extra) {
      extra = {}
    }

    if (!extra.artifactId) {
      log.debug(
        `Using default artifactId: ${MavenPublisher.DEFAULT_ARTIFACT_ID}`
      )
      extra.artifactId = MavenPublisher.DEFAULT_ARTIFACT_ID
    }

    if (!extra.groupId) {
      log.debug(`Using default groupId: ${MavenPublisher.DEFAULT_GROUP_ID}`)
      extra.groupId = MavenPublisher.DEFAULT_GROUP_ID
    }

    if (!url) {
      log.debug(`Using default url: ${MavenPublisher.DEFAULT_URL}`)
      url = MavenPublisher.DEFAULT_URL
    }

    url = MavenUtils.processUrl(url)
    if (MavenUtils.isLocalMavenRepo(url)) {
      MavenUtils.createLocalMavenDirectoryIfDoesNotExist(url)
    }

    fs.appendFileSync(
      path.join(containerPath, 'lib', 'build.gradle'),
      `
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

${MavenUtils.targetRepositoryGradleStatement(url, {
        mavenPassword: extra && extra.mavenPassword,
        mavenUser: extra && extra.mavenUser,
      })}
  }`
    )

    try {
      log.info('[=== Starting build and publication ===]')
      shell.pushd(containerPath)
      await this.buildAndUploadArchive()
      log.info('[=== Completed build and publication of the Container ===]')
      log.info(`[Publication url : ${url}]`)
      log.info(
        `[Artifact: ${extra.groupId}:${extra.artifactId}:${containerVersion} ]`
      )
    } finally {
      shell.popd()
    }
  }

  public async buildAndUploadArchive(): Promise<any> {
    const gradlew = /^win/.test(process.platform) ? 'gradlew' : './gradlew'
    return execp(`${gradlew} publish`)
  }
}
