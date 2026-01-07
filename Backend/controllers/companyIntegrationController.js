const Certificate = require('../models/Certificate');
const Candidate = require('../models/Candidate');
const mongoose = require('mongoose');

// Get candidate data by certificate ID
const getCandidateByCertificateId = async (req, res) => {
  try {
    const { certificateId } = req.params;

    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: 'Sertifikat ID kiritilishi shart',
      });
    }

    // Check if certificateId is a valid ObjectId
    let certificate;
    if (mongoose.Types.ObjectId.isValid(certificateId)) {
      // If it's a valid ObjectId, search by _id
      certificate = await Certificate.findById(certificateId)
        .populate('candidate')
        .populate('issuedBy', 'username email');
    } else {
      // If it's not a valid ObjectId, try to find by certificateNumber or qrCode
      certificate = await Certificate.findOne({
        $or: [
          { certificateNumber: certificateId },
          { qrCode: certificateId },
        ],
      })
        .populate('candidate')
        .populate('issuedBy', 'username email');
    }

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Sertifikat topilmadi',
      });
    }

    if (certificate.status === 'revoked') {
      return res.status(400).json({
        success: false,
        message: 'Certificate is revoked',
      });
    }

    const candidate = certificate.candidate;

    // Format response according to API documentation
    const responseData = {
      certificate: {
        id: certificate._id,
        certificateNumber: certificate.certificateNumber,
        qrCode: certificate.qrCode,
        issuedDate: certificate.issuedDate,
        status: certificate.status,
      },
      candidate: {
        id: candidate._id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        fullName: candidate.fullName,
        phone: candidate.phone,
        telegramId: candidate.telegramId || null,
        registrationType: candidate.registrationType,
      },
      vacancy: {
        title: candidate.vacancyTitle || null,
        department: candidate.vacancyDepartment || null,
        position: candidate.vacancyPosition || null,
      },
      interview: {
        date: candidate.interviewDate || null,
        averageRating: candidate.interviewRating || null,
      },
      application: {
        status: candidate.applicationStatus,
      },
      testResults: [],
      averageTestScore: candidate.averageTestScore || null,
      issuedBy: {
        id: certificate.issuedBy._id,
        username: certificate.issuedBy.username,
        email: certificate.issuedBy.email || null,
      },
    };

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error in getCandidateByCertificateId:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Get candidate data by certificate number
const getCandidateByCertificateNumber = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    if (!certificateNumber) {
      return res.status(400).json({
        success: false,
        message: 'Sertifikat raqami kiritilishi shart',
      });
    }

    const certificate = await Certificate.findOne({ certificateNumber })
      .populate('candidate')
      .populate('issuedBy', 'username email');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    if (certificate.status === 'revoked') {
      return res.status(400).json({
        success: false,
        message: 'Certificate is revoked',
      });
    }

    const candidate = certificate.candidate;

    // Format response according to API documentation
    const responseData = {
      certificate: {
        id: certificate._id,
        certificateNumber: certificate.certificateNumber,
        qrCode: certificate.qrCode,
        issuedDate: certificate.issuedDate,
        status: certificate.status,
      },
      candidate: {
        id: candidate._id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        fullName: candidate.fullName,
        phone: candidate.phone,
        telegramId: candidate.telegramId || null,
        registrationType: candidate.registrationType,
      },
      vacancy: {
        title: candidate.vacancyTitle || null,
        department: candidate.vacancyDepartment || null,
        position: candidate.vacancyPosition || null,
      },
      interview: {
        date: candidate.interviewDate || null,
        averageRating: candidate.interviewRating || null,
      },
      application: {
        status: candidate.applicationStatus,
      },
      testResults: [],
      averageTestScore: candidate.averageTestScore || null,
      issuedBy: {
        id: certificate.issuedBy._id,
        username: certificate.issuedBy.username,
        email: certificate.issuedBy.email || null,
      },
    };

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error in getCandidateByCertificateNumber:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getCandidateByCertificateId,
  getCandidateByCertificateNumber,
};

