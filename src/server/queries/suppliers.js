const Promise = require('bluebird');

module.exports.init = function(db, config)
{
  db.models.Supplier.hasMany(db.models.SupplierContact, { foreignKey: 'supplierId', sourceKey: 'supplierId' });
  db.models.Supplier.hasMany(db.models.SupplierAddress, { foreignKey: 'supplierId', sourceKey: 'supplierId' });
  db.models.Supplier.hasMany(db.models.SupplierBankAccount, { foreignKey: 'supplierId', sourceKey: 'supplierId' });

  this.db = db;
  return Promise.resolve(this);
};

module.exports.all = function(queryObj, includes)
{
  const associations = {
    contacts: this.db.models.SupplierContact,
    addresses: this.db.models.SupplierAddress,
    bankAccounts: this.db.models.SupplierBankAccount
  }

  let includeModels = [];

  for (const index in includes) {
    const association = includes[index];
    if (associations[association])
      includeModels.push(associations[association]);
  }

  return this.db.models.Supplier.findAll({ where: queryObj, include: includeModels }).map(supplier => {
    supplier.dataValues.contacts = supplier.SupplierContacts;
    supplier.dataValues.addresses = supplier.SupplierAddresses;
    supplier.dataValues.bankAccounts = supplier.SupplierBankAccounts;

    delete supplier.dataValues.SupplierContacts;
    delete supplier.dataValues.SupplierAddresses;
    delete supplier.dataValues.SupplierBankAccounts;

    return supplier.dataValues;
  });
};

module.exports.count = function(queryObj)
{
  if (Object.keys(queryObj).length === 0) return this.db.models.Supplier.count();

  return this.db.models.Supplier.count({ where: queryObj });
};

module.exports.find = function(supplierId)
{
  return this.db.models.Supplier.findById(supplierId);
};

module.exports.create = function(supplier)
{
  const self = this;
  let supplierId = supplier.supplierName.replace(/[^0-9a-z_\-]/gi, '');

  function generateSupplierId(id) {
    return self.exists(id).then(exists => {
      if (exists) {
        return generateSupplierId(supplierId + randomNumber());
      } else {
        return id;
      }
    });
  }

  return generateSupplierId(supplierId).then(id => {
    supplier.supplierId = id;
    supplier.role = 'selling';
    return this.db.models.Supplier.create(supplier);
  });
};

module.exports.update = function(supplierId, supplier)
{
  let self = this;
  return this.db.models.Supplier.update(supplier, { where: { supplierId: supplierId } }).then(() => {
    return self.find(supplierId);
  });
};

module.exports.delete = function(supplierId)
{
  return this.db.models.Supplier.destroy({ where: { supplierId: supplierId } }).then(() => null);
};

module.exports.exists = function(supplierId)
{
  return this.db.models.Supplier.findById(supplierId).then(supplier => supplier && supplier.supplierId === supplierId);
};

module.exports.recordExists = function(supplier)
{
  const options = {
    $or: [
      {
        dunsNo: { $eq: supplier.dunsNo, $ne: null, $notIn: [''] }
      },
      {
        globalLocationNo: { $eq: supplier.globalLocationNo, $ne: null, $notIn: [''] }
      },
      {
        vatIdentificationNo: { $eq: supplier.vatIdentificationNo, $ne: null, $notIn: [''] }
      },
      {
        $and: {
          commercialRegisterNo: { $eq: supplier.commercialRegisterNo, $ne: null, $notIn: [''] },
          cityOfRegistration: { $eq: supplier.cityOfRegistration },
          countryOfRegistration: { $eq: supplier.countryOfRegistration }
        }
      },
      {
        $and: {
          taxIdentificationNo: { $eq: supplier.taxIdentificationNo, $ne: null, $notIn: [''] },
          countryOfRegistration: { $eq: supplier.countryOfRegistration }
        }
      }
    ]
  }

  return this.db.models.Supplier.findOne({ where: options }).then(supplier => Boolean(supplier));
};

module.exports.isAuthorized = function(supplierId, changedBy)
{
  return this.db.models.Supplier.findById(supplierId).then(supplier => supplier && supplier.changedBy === changedBy);
};

let randomNumber = function()
{
  return Math.floor((Math.random() * 1000));
}
