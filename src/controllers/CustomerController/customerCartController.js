const cartModel = require("../../modals/cart.model");
const medicineModel = require("../../modals/medicine.model");
const testModel = require("../../modals/test.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");

module.exports.addToCart = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    let { productId, quantity, type } = req.body;

    if (!productId || !quantity || !type) {
        return res.status(400).json({ message: 'Product ID, quantity, and type are required.' });
    }
    quantity = Number(quantity);
    let findOriginalProduct;
    let name, price, details;

    if (type === 'Medicine') {
        findOriginalProduct = await medicineModel.findById(productId);
        if (!findOriginalProduct) {
            return next(new CustomError("Medicine not found", 404));
        }
        name = findOriginalProduct.name;
        price = findOriginalProduct.price;
        details = {
            company: findOriginalProduct.company,
            description: findOriginalProduct.description
        };
    } else if (type === 'test') {
        findOriginalProduct = await testModel.findById(productId);
        if (!findOriginalProduct) {
            return next(new CustomError("Test not found", 404));
        }
        name = findOriginalProduct.name;
        price = findOriginalProduct.price;
        details = {
            available_at_home: findOriginalProduct.available_at_home,
            sample_required: findOriginalProduct.sample_required,
            description: findOriginalProduct.description
        };
    } else {
        return next(new CustomError("Invalid item type", 400));
    }

    let cart = await cartModel.findOne({ user_id: userId });

    if (!cart) {
        cart = await cartModel.create({
            user_id: userId,
            items: [{
                item_type: type,
                item_id: productId,
                quantity,
                price,
                name,
                details
            }]
        });
    } else {
        const itemIndex = cart.items.findIndex(
            i => i.item_id.toString() === productId && i.item_type === type
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({
                item_type: type,
                item_id: productId,
                quantity,
                price,
                name,
                details
            });
        }

        await cart.save();
    }
    return successRes(res, 201, true, "Item added to cart successfully", cart)
});

module.exports.getCart = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    const cart = await cartModel.findOne({ user_id: userId }).populate("items.item_id");
    if (!cart) {
        return next(new CustomError("Cart not found", 404));
    }
    return successRes(res, 200, true, "Cart found successfully", cart);
});

module.exports.changeQuantity = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { itemId, quantity, type } = req.body;
    const cart = await cartModel.findOne({ user_id: userId });
    if (!cart) {
        return next(new CustomError("Cart not found", 404));
    }
    const itemIndex = cart.items.findIndex(
        i => i.item_id.toString() === itemId && i.item_type === type
    );
    if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        return successRes(res, 200, true, "Quantity changed successfully", cart);
    } else {
        return next(new CustomError("Item not found in cart", 404));
    }
});

module.exports.removeItemFromCart = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { itemId, type } = req.body;
    const cart = await cartModel.findOne({ user_id: userId });
    if (!cart) {
        return next(new CustomError("Cart not found", 404));
    }
    const itemIndex = cart.items.findIndex(
        i => i.item_id.toString() === itemId && i.item_type === type
    );
    if (itemIndex > -1) {
        cart.items.splice(itemIndex, 1);
        await cart.save();
        return successRes(res, 200, true, "Item removed from cart successfully", cart);
    } else {
        return next(new CustomError("Item not found in cart", 404));
    }
});

