import MavenUtils from '../src/MavenUtils'
import { expect } from 'chai'
import 'mocha'

const fileRepoUrl = 'file://Users/username/repo'
const httpRepoUrl = 'http://mymavenrepo.com:8081/repository'
const httpsRepoUrl = 'https://mymavenrepo.com:443/repository'
const unknownRepoUrl = 'toto'

describe('MavenUtils', () => {
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
      expect(result).eql(`repository(url: "${fileRepoUrl}")`)
    })

    it('should ignore user and pass for a file repository', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(fileRepoUrl, {
        mavenUser: 'user',
        mavenPassword: 'password'
      })
      expect(result).eql(`repository(url: "${fileRepoUrl}")`)
    })

    it('should return the gradle statement for an http repository', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(httpRepoUrl)
      expect(result).eql(`repository(url: "${httpRepoUrl}") `)
    })

    it('should return the gradle statement for an http repository with user and pass plain strings', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(httpRepoUrl, {
        mavenUser: 'user',
        mavenPassword: 'password'
      })
      expect(result).eql(`repository(url: "${httpRepoUrl}") { authentication(userName: "user", password: "password") }`)
    })

    it('should return the gradle statement for an http repository with user and pass var', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(httpRepoUrl, {
        mavenUser: '[user]',
        mavenPassword: '[password]'
      })
      expect(result).eql(`repository(url: "${httpRepoUrl}") { authentication(userName: user, password: password) }`)
    })

    it('should return the gradle statement for an https repository', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(httpsRepoUrl)
      expect(result).eql(`repository(url: "${httpsRepoUrl}") `)
    })

    it('should return the gradle statement for an https repository with user and pass plain strings', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(httpsRepoUrl, {
        mavenUser: 'user',
        mavenPassword: 'password'
      })
      expect(result).eql(`repository(url: "${httpsRepoUrl}") { authentication(userName: "user", password: "password") }`)
    })

    it('should return the gradle statement for an https repository with user and pass var', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(httpsRepoUrl, {
        mavenUser: '[user]',
        mavenPassword: '[password]'
      })
      expect(result).eql(`repository(url: "${httpsRepoUrl}") { authentication(userName: user, password: password) }`)
    })

    it('should return undefined for an unknown repository type', () => {
      const result = MavenUtils.targetRepositoryGradleStatement(unknownRepoUrl)
      expect(result).undefined
    })
  })
})