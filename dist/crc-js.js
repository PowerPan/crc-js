/**
 * Created by Johannes Rudolph on 09.12.2016.
 *
 * Based On:
 * Implementation to calculate the CRC value for a given string / string of bytes.
 * Sunshine, May 2k15
 * www.sunshine2k.de || www.bastian-molkenthin.de
 */


var Crc = function (options) {
    this.initialize (options);
};

Crc.prototype = {

    version: "2.0.0",

    initialize: function (options) {
            this._width = options.width;
            this._polynomial = options.polynomial;
            this._initialVal = options.initial;
            this._finalXorVal = options.finalXor;
            this._inputReflected = options.inputReflected;
            this._resultReflected = options.resultReflected;


        switch (this._width)
        {
            case 8: this._castMask = 0xFF; break;
            case 16: this._castMask = 0xFFFF; break;
            case 32: this._castMask = 0xFFFFFFFF; break;
            default: throw "Invalid CRC width";
        }

        this._msbMask = 0x01 << (this._width - 1);

        this.calcCrcTable();
    },

    calcCrcTable: function(){
        this._crcTable = new Array(256);

        for (var divident = 0; divident < 256; divident++)
        {
            var currByte = (divident << (this._width - 8)) & this._castMask;
            for (var bit = 0; bit < 8; bit++)
            {
                if ((currByte & this._msbMask) !== 0)
                {
                    currByte <<= 1;
                    currByte ^= this._polynomial;
                }
                else
                {
                    currByte <<= 1;
                }
            }
            this._crcTable[divident] = (currByte & this._castMask);

        }
    },

    compute : function (bytes){
        var crc = this._initialVal;
        for (var i = 0; i < bytes.length; i++){

            var curByte = bytes[i] & 0xFF;

            if (this._inputReflected){
                curByte = this.reflect(curByte, 8);
            }

            /* update the MSB of crc value with next input byte */
            crc = (crc ^ (curByte << (this._width - 8))) & this._castMask;
            /* this MSB byte value is the index into the lookup table */
            var pos = (crc >> (this._width - 8)) & 0xFF;
            /* shift out this index */
            crc = (crc << 8) & this._castMask;
            /* XOR-in remainder from lookup table using the calculated index */
            crc = (crc ^ this._crcTable[pos]) & this._castMask;
        }

        if (this._resultReflected) {
            crc = this.reflect(crc, this._width);
        }
        return ((crc ^ this._finalXorVal) & this._castMask);
    },

    reflect: function (val, width) {
        var resByte = 0;

        for (var i = 0; i < width; i++) {
            if ((val & (1 << i)) !== 0) {
                resByte |= (1 << ((width-1) - i));
            }
        }

        return resByte;
    }
};

module.exports.Crc = Crc;
/**
 * Created by Johannes Rudolph on 09.12.2016.
 */

/* Known CRC algorihtms */
var CrcDatabase = {
    "CRC8"                  : new CrcModel(8, "CRC8", 0x07, 0x00, 0x00, false, false),
    "CRC8_SAE_J1850"        : new CrcModel(8, "CRC8_SAE_J1850", 0x1D, 0xFF, 0xFF, false, false),
    "CRC8_SAE_J1850_ZERO"   : new CrcModel(8, "CRC8_SAE_J1850_ZERO", 0x1D, 0x00, 0x00, false, false),
    "CRC8_8H2F"             : new CrcModel(8, "CRC8_8H2F", 0x2F, 0xFF, 0xFF, false, false),
    "CRC8_CDMA2000"         : new CrcModel(8, "CRC8_CDMA2000", 0x9B, 0xFF, 0x00, false, false),
    "CRC8_DARC"             : new CrcModel(8, "CRC8_DARC", 0x39, 0x00, 0x00, true, true),
    "CRC8_DVB_S2"           : new CrcModel(8, "CRC8_DVB_S2", 0xD5, 0x00, 0x00, false, false),
    "CRC8_EBU"              : new CrcModel(8, "CRC8_EBU", 0x1D, 0xFF, 0x00, true, true),
    "CRC8_ICODE"            : new CrcModel(8, "CRC8_ICODE", 0x1D, 0xFD, 0x00, false, false),
    "CRC8_ITU"              : new CrcModel(8, "CRC8_ITU", 0x07, 0x00, 0x55, false, false),
    "CRC8_MAXIM"            : new CrcModel(8, "CRC8_MAXIM", 0x31, 0x00, 0x00, true, true),
    "CRC8_ROHC"             : new CrcModel(8, "CRC8_ROHC", 0x07, 0xFF, 0x00, true, true),
    "CRC8_WCDMA"            : new CrcModel(8, "CRC8_WCDMA", 0x9B, 0x00, 0x00, true, true),

    "CRC16_CCIT_ZERO"       : new CrcModel(16, "CRC16_CCIT_ZERO", 0x1021, 0x0000, 0x0000, false, false),
    "CRC16_ARC"             : new CrcModel(16, "CRC16_ARC", 0x8005, 0x0000, 0x0000, true, true),
    "CRC16_AUG_CCITT"       : new CrcModel(16, "CRC16_AUG_CCITT", 0x1021, 0x1D0F, 0x0000, false, false),
    "CRC16_BUYPASS"         : new CrcModel(16, "CRC16_BUYPASS", 0x8005, 0x0000, 0x0000, false, false),
    "CRC16_CCITT_FALSE"     : new CrcModel(16, "CRC16_CCITT_FALSE", 0x1021, 0xFFFF, 0x0000, false, false),
    "CRC16_CDMA2000"        : new CrcModel(16, "CRC16_CDMA2000", 0xC867, 0xFFFF, 0x0000, false, false),
    "CRC16_DDS_110"         : new CrcModel(16, "CRC16_DDS_110", 0x8005, 0x800D, 0x0000, false, false),
    "CRC16_DECT_R"          : new CrcModel(16, "CRC16_DECT_R", 0x0589, 0x0000, 0x0001, false, false),
    "CRC16_DECT_X"          : new CrcModel(16, "CRC16_DECT_X", 0x0589, 0x0000, 0x0000, false, false),
    "CRC16_DNP"             : new CrcModel(16, "CRC16_DNP", 0x3D65, 0x0000, 0xFFFF, true, true),
    "CRC16_EN_13757"        : new CrcModel(16, "CRC16_EN_13757", 0x3D65, 0x0000, 0xFFFF, false, false),
    "CRC16_GENIBUS"         : new CrcModel(16, "CRC16_GENIBUS", 0x1021, 0xFFFF, 0xFFFF, false, false),
    "CRC16_MAXIM"           : new CrcModel(16, "CRC16_MAXIM", 0x8005, 0x0000, 0xFFFF, true, true),
    "CRC16_MCRF4XX"         : new CrcModel(16, "CRC16_MCRF4XX", 0x1021, 0xFFFF, 0x0000, true, true),
    "CRC16_RIELLO"          : new CrcModel(16, "CRC16_RIELLO", 0x1021, 0xB2AA, 0x0000, true, true),
    "CRC16_T10_DIF"         : new CrcModel(16, "CRC16_T10_DIF", 0x8BB7, 0x0000, 0x0000, false, false),
    "CRC16_TELEDISK"        : new CrcModel(16, "CRC16_TELEDISK", 0xA097, 0x0000, 0x0000, false, false),
    "CRC16_TMS37157"        : new CrcModel(16, "CRC16_TMS37157", 0x1021, 0x89EC, 0x0000, true, true),
    "CRC16_USB"             : new CrcModel(16, "CRC16_USB", 0x8005, 0xFFFF, 0xFFFF, true, true),
    "CRC16_A"               : new CrcModel(16, "CRC16_A", 0x1021, 0xC6C6, 0x0000, true, true),
    "CRC16_KERMIT"          : new CrcModel(16, "CRC16_KERMIT", 0x1021, 0x0000, 0x0000, true, true),
    "CRC16_MODBUS"          : new CrcModel(16, "CRC16_MODBUS", 0x8005, 0xFFFF, 0x0000, true, true),
    "CRC16_X_25"            : new CrcModel(16, "CRC16_X_25", 0x1021, 0xFFFF, 0xFFFF, true, true),
    "CRC16_XMODEM"          : new CrcModel(16, "CRC16_XMODEM", 0x1021, 0x0000, 0x0000, false, false),

    "CRC32"                 : new CrcModel(32, "CRC32", 0x04C11DB7, 0xFFFFFFFF, 0xFFFFFFFF, true, true),
    "CRC32_BZIP2"           : new CrcModel(32, "CRC32_BZIP2", 0x04C11DB7, 0xFFFFFFFF, 0xFFFFFFFF, false, false),
    "CRC32_C"               : new CrcModel(32, "CRC32_C", 0x1EDC6F41, 0xFFFFFFFF, 0xFFFFFFFF, true, true),
    "CRC32_D"               : new CrcModel(32, "CRC32_D", 0xA833982B, 0xFFFFFFFF, 0xFFFFFFFF, true, true),
    "CRC32_MPEG2"           : new CrcModel(32, "CRC32_MPEG2", 0x04C11DB7, 0xFFFFFFFF, 0x00000000, false, false),
    "CRC32_POSIX"           : new CrcModel(32, "CRC32_POSIX", 0x04C11DB7, 0x00000000, 0xFFFFFFFF, false, false),
    "CRC32_Q"               : new CrcModel(32, "CRC32_Q", 0x814141AB, 0x00000000, 0x00000000, false, false),
    "CRC32_JAMCRC"          : new CrcModel(32, "CRC32_JAMCRC", 0x04C11DB7, 0xFFFFFFFF, 0x00000000, true, true),
    "CRC32_XFER"            : new CrcModel(32, "CRC32_XFER", 0x000000AF, 0x00000000, 0x00000000, false, false)
};

exports.CrcDatabase = CrcDatabase;

/**
 * Created by Johannes Rudolph on 09.12.2016.
 */

function CrcModel (width, name, polynomial, initial, finalXor, inputReflected, resultReflected) {
    this.width = width;
    this.name = name;
    this.polynomial = polynomial;
    this.initial = initial;
    this.finalXor = finalXor;
    this.inputReflected = inputReflected;
    this.resultReflected = resultReflected;
}