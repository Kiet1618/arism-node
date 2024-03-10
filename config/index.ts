import * as dotenv from 'dotenv'

const isProduction = process.env.NODE_ENV === 'production'
dotenv.config({ path: isProduction ? '.env' : '.env.local' })

const nodes = [
    {
        id: 1,
        url: process.env.NODE1_URL,
    },
    {
        id: 2,
        url: process.env.NODE2_URL,
    },
    {
        id: 3,
        url: process.env.NODE3_URL,
    },
]

const nodePrivateKeys = [
    {
        id: 1,
        privateKey: process.env.NODE1_PRIVATE_KEY,
    },
    {
        id: 2,
        privateKey: process.env.NODE2_PRIVATE_KEY,
    },
    {
        id: 3,
        privateKey: process.env.NODE3_PRIVATE_KEY,
    },
]

const productionConfig = {
    url: nodes.find((node) => node.id === Number(process.env.NODE_ID)).url,
    port: 3000,
    database: {
        mongoUri: process.env.MONGO_URI,
    },
    privateKey: process.env.PRIVATE_KEY,
    nodes: nodes,
}

const localConfig = {
    url: nodes.find((node) => node.id === Number(process.env.NODE_ID)).url,
    port: 3000 + Number(process.env.NODE_ID),
    database: {
        mongoUri: `mongodb+srv://kiet1618:12052002@kltn.mbww3bu.mongodb.net/node${process.env.NODE_ID}?retryWrites=true&w=majority`,
    },
    privateKey: nodePrivateKeys.find(
        (node) => node.id === Number(process.env.NODE_ID)
    ),
    nodes: nodes,
}

export default () => (isProduction ? productionConfig : localConfig)
