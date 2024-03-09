import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../app.module'

describe('PingController (e2e)', () => {
    let app: INestApplication

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()

        app = moduleFixture.createNestApplication()
        await app.init()
    })

    it('/ping (GET)', () => {
        return request(app.getHttpServer()).get('/').expect(200).expect('pong')
    })

    afterEach(async () => {
        await app.close()
    })
})
