module.exports = {
    spec: {
        Address: "AccountId",
        NFTId: "u32",
        NFTIdOf: "NFTId",
        NFTData: {
            owner: "AccountId",
            details: "NFTDetails",
            sealed: "bool",
            locked: "bool"
        },
        NFTDetails: {
            offchain_uri: "Vec<u8>"
        },
        LookupSource: "AccountId"
    }
};