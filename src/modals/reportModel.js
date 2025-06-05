const mongoose = require('mongoose');

const testReportSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PathologyOrder',
        required: true
    },
    pathologyCenterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PathologyCenter',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    reportName: {
        type: String,
        required: true
    },
    reportFiles: [
        {
            fileUrl: { type: String, required: true },
            pageNumber: { type: Number }
        }
    ],
}, {
    timestamps: true
});

module.exports = mongoose.model('TestReport', testReportSchema);
