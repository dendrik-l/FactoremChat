const getTargetUid = (message) => {
    var quotationId = message.quotationId
    // TODO: communicate with API server for two parties of a quotation
    var [suid,tuid] = getQuotationParties(quotationId)
    return tuid
}