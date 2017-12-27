import SimpleSchema from 'simpl-schema';
export const ProductImprintDataSchemas = new SimpleSchema({
    sr_no: {
        type: Number,
        label: "sr no",
        max: 1090,
        optional: true
    },
    product_id: {
        type: String,
        label: "Product Id"
    },
    sku: {
        type: String,
        label: "SKU",
        max: 200
    },
    imprint_position: {
        type: String,
        label: "Imprint Position"
    },
    imprint_area: {
        type: String,
        label: "Imprint Area",
    },
    matrix: {
        type: String,
        label: "Matrix"
    },
    max_imprint_color_allowed: {
        type: Number,
        label: "Max Imprint Color allowed"
    },
    price_included: {
        type: Number,
        label: "Price Included"
    },
    max_location_allowed: {
        type: Number,
        label: "Max Location allowed"
    },
    location_price_included: {
        type: Number,
        label: "Location Price Included",
        max: 200
    },
    full_color: {
        type: String,
        label: "Full Color"
    },
    production_days: {
        type: String,
        label: "Production Days"
    },
    production_unit: {
        type: Number,
        label: "Production unit"
    },
    setup_charge: {
        type: Number,
        label: "Setup Charge",
        max: 200
    },
    additional_location_charge: {
        type: Number,
        label: "Additional Location Charge"
    },

    additional_color_charge: {
        type: Number,
        label: "Additional Color Charge"
    },
    rush_charge: {
        type: Number,
        label: "Rush Charge"
    },
    ltm_charge: {
        type: Number,
        label: "LTM Charge",
        max: 200
    },
    pms_charge: {
        type: Number,
        label: "PMS Charge"
    },
    qty_1_min: {
        type: Number,
        label: "Qty_1_Min"
    },
    qty_1_max: {
        type: Number,
        label: "Qty_1_Max"
    },
    price_1: {
        type: Number,
        label: "Price_1",
        max: 200
    },
    code_1: {
        type: Number,
        label: "Code_1"
    },

    qty_2_min: {
        type: Number,
        label: "Qty_2_Min",
        optional : true
    },
    qty_2_max: {
        type: Number,
        label: "Qty_2_Max",
        optional : true
    },
    price_2: {
        type: Number,
        label: "Price_2",
        max: 200,
        optional : true
    },
    code_2: {
        type: Number,
        label: "Code_2",
        optional : true
    },

    qty_3_min: {
        type: Number,
        label: "Qty_3_Min",
        optional : true
    },
    qty_3_max: {
        type: Number,
        label: "Qty_3_Max",
        optional : true
    },
    price_3: {
        type: Number,
        label: "Price_3",
        max: 200,
        optional : true
    },
    code_3: {
        type: Number,
        label: "Code_3",
        optional : true
    },

    qty_4_min: {
        type: Number,
        label: "Qty_4_Min",
        optional : true
    },
    qty_4_max: {
        type: Number,
        label: "Qty_4_Max",
        optional : true
    },
    price_4: {
        type: Number,
        label: "Price_4",
        max: 200,
        optional : true
    },
    code_4: {
        type: Number,
        label: "Code_4",
        optional : true
    },
    qty_5_min: {
        type: Number,
        label: "Qty_5_Min",
        optional : true
    },
    qty_5_max: {
        type: Number,
        label: "Qty_5_Max",
        optional : true
    },
    price_5: {
        type: Number,
        label: "Price_5",
        max: 200,
        optional : true
    },
    code_5: {
        type: Number,
        label: "Code_5",
        optional : true
    },

    qty_6_min: {
        type: Number,
        label: "Qty_6_Min",
        optional : true
    },
    qty_6_max: {
        type: Number,
        label: "Qty_6_Max",
        optional : true
    },
    price_6: {
        type: Number,
        label: "Price_6",
        max: 200,
        optional : true
    },
    code_6: {
        type: Number,
        label: "Code_6",
        optional : true
    },

    qty_7_min: {
        type: Number,
        label: "Qty_7_Min",
        optional : true
    },
    qty_7_max: {
        type: Number,
        label: "Qty_7_Max",
        optional : true
    },
    price_7: {
        type: Number,
        label: "Price_7",
        max: 200,
        optional : true
    },
    code_7: {
        type: Number,
        label: "Code_7",
        optional : true
    },

    qty_8_min: {
        type: Number,
        label: "Qty_8_Min",
        optional : true
    },
    qty_8_max: {
        type: Number,
        label: "Qty_8_Max",
        optional : true
    },
    price_8: {
        type: Number,
        label: "Price_8",
        max: 200,
        optional : true
    },
    code_8: {
        type: Number,
        label: "Code_8",
        optional : true
    },

    qty_9_min: {
        type: Number,
        label: "Qty_9_Min",
        optional : true
    },
    qty_9_max: {
        type: Number,
        label: "Qty_9_Max",
        optional : true
    },
    price_9: {
        type: Number,
        label: "Price_9",
        max: 200,
        optional : true
    },
    code_9: {
        type: Number,
        label: "Code_9",
        optional : true
    },

    qty_10_min: {
        type: Number,
        label: "Qty_10_Min",
        optional : true
    },
    qty_10_max: {
        type: Number,
        label: "Qty_10_Max",
        optional : true
    },
    price_10: {
        type: Number,
        label: "Price_10",
        max: 200,
        optional : true
    },
    code_10: {
        type: Number,
        label: "Code_10",
        optional : true
    },
    fileID: {
        type: String,
        label: "file ID"
    },
    owner: {
        type: String,
        label: "owner"
    },
    username: {
        type: String,
        label: "username"
    }
});
