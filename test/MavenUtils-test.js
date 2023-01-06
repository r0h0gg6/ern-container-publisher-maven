import MavenUtils from '../src/MavenUtils'
import { expect } from 'chai'
import 'mocha'
import sinon from 'sinon'
import fs from 'fs'
import os from 'os'
import * as core from 'ern-core'

const fileRepoUrl = 'file://Users/username/repo'
const httpRepoUrl = 'http://mymavenrepo.com:8081/repository'
const httpsRepoUrl = 'https://mymavenrepo.com:443/repository'
const unknownRepoUrl = 'toto'
const mavenTestUser = 'user'
const mavenTestPassword = 'password'

const sandbox = sinon.createSandbox()

describe('MavenUtils', () => {
  afterEach(() => {
    sandbox.restore()
  })

  describe('mavenRepositoryType', () => {
    it('should return http for an http repo url', () => {
      const result = MavenUtils.mavenRepositoryType(httpRepoUrl)
      expect(result).eql('http')
    })

    it('should return http for an https repo url', () => {
      const result = MavenUtils.mavenRepositoryType(httpsRepoUrl)
      expect(result).eql('http')
    })

    it('should return file for an local fs url', () => {
      const result = MavenUtils.mavenRepositoryType(fileRepoUrl)
      expect(result).eql('file')
    })

    it('should return unknown if the url type is unkown', () => {
      const result = MavenUtils.mavenRepositoryType(unknownRepoUrl)
      expect(result).eql('unknown')
    })
  })

  describe('targetRepositoryGradleStatement', () => {
    it('should return the gradle statement for a file repository', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(fileRepoUrl)
      expect(result).eql(`
    repositories {
        maven {
            url = "${fileRepoUrl}"
        }
    }`)
    })

    it('should ignore user and pass for a file repository', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(fileRepoUrl, {
        mavenUser: mavenTestUser,
        mavenPassword: mavenTestUser
      })
      expect(result).eql(`
    repositories {
        maven {
            url = "${fileRepoUrl}"
        }
    }`)
    })

    it('should return the gradle statement for an http repository', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(httpRepoUrl)
      expect(result).eql(`
    repositories {
        maven {
            url = "${httpRepoUrl}"
        }
    }`)
    })

    it('should return the gradle statement for an http repository with user and pass plain strings', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(httpRepoUrl, {
        mavenUser: mavenTestUser,
        mavenPassword: mavenTestPassword
      })
      expect(result).eql(`
    repositories {
        maven {
            url = "${httpRepoUrl}"
            credentials {
                username = ${mavenTestUser}
                password = ${mavenTestPassword}
            }
        }
    }`)
    })

    it('should return the gradle statement for an http repository with user and pass var', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(httpRepoUrl, {
        mavenUser: '[user]',
        mavenPassword: '[password]'
      })
      expect(result).eql(`
    repositories {
        maven {
            url = "${httpRepoUrl}"
            credentials {
                username = ${mavenTestUser}
                password = ${mavenTestPassword}
            }
        }
    }`)
    })

    it('should return the gradle statement for an https repository', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(httpsRepoUrl)
      expect(result).eql(`
    repositories {
        maven {
            url = "${httpsRepoUrl}"
        }
    }`)
    })

    it('should return the gradle statement for an https repository with user and pass plain strings', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(httpsRepoUrl, {
        mavenUser: mavenTestUser,
        mavenPassword: mavenTestPassword
      })
      expect(result).eql(`
    repositories {
        maven {
            url = "${httpsRepoUrl}"
            credentials {
                username = ${mavenTestUser}
                password = ${mavenTestPassword}
            }
        }
    }`)
    })

    it('should return the gradle statement for an https repository with user and pass var', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(httpsRepoUrl, {
        mavenUser: '[user]',
        mavenPassword: '[password]'
      })
      expect(result).eql(`
    repositories {
        maven {
            url = "${httpsRepoUrl}"
            credentials {
                username = ${mavenTestUser}
                password = ${mavenTestPassword}
            }
        }
    }`)
    })

    it('should return undefined for an unknown repository type', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(unknownRepoUrl)
      expect(result).undefined
    })
  })

  describe('processUrl', () => {
    it('should replace tidle with home directory [1]', () => {
      const result = MavenUtils.processUrl('file:~/test')
      expect(result).eql(`file:${os.homedir()}/test`)
    })

    it('should replace tidle with home directory [2]', () => {
      const result = MavenUtils.processUrl('file://~/test')
      expect(result).eql(`file://${os.homedir()}/test`)
    })

    it('should evaluate env variables', () => {
      const result = MavenUtils.processUrl('file://${HOME}/test')
      expect(result).eql(`file://${os.homedir()}/test`)
    })

    it('should evaluate env variables with fallback', () => {
      const result = MavenUtils.processUrl('file://${NONEXISTINGVAR|HOME}/test')
      expect(result).eql(`file://${os.homedir()}/test`)
    })
  })

  describe('createLocalMavenDirectoryIfDoesNotExist', () => {
    it('should create the directory [1]', () => {
      sandbox.stub(fs, 'existsSync').returns(false)
      const mkdirStub = sandbox.stub(core.shell, 'mkdir')
      MavenUtils.createLocalMavenDirectoryIfDoesNotExist(MavenUtils.getDefaultMavenLocalUrl())
      sandbox.assert.calledWith(mkdirStub, '-p', MavenUtils.getDefaultMavenLocalDirectory())
    })

    it('should create the directory [2]', () => {
      sandbox.stub(fs, 'existsSync').returns(false)
      const mkdirStub = sandbox.stub(core.shell, 'mkdir')
      MavenUtils.createLocalMavenDirectoryIfDoesNotExist('file:///Users/foo/bar')
      sandbox.assert.calledWith(mkdirStub, '-p', '/Users/foo/bar')
    })

    it('should not create the directory if it exists', () => {
      sandbox.stub(fs, 'existsSync').returns(true)
      const mkdirStub = sandbox.stub(core.shell, 'mkdir')
      MavenUtils.createLocalMavenDirectoryIfDoesNotExist('file:///Users/foo/bar')
      sandbox.assert.notCalled(mkdirStub)
    })
  })
})
