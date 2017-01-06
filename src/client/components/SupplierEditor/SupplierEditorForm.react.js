import React, { PropTypes, Component } from 'react';
import _ from 'underscore';
import validatejs from 'validate.js';
import i18n from '../../i18n/I18nDecorator.react.js';
import DateConverter from 'opuscapita-i18n/lib/converters/DateConverter';
import SupplierEditorFormRow from './SupplierEditorFormRow.react.js'
import DatePicker from '../DatePicker';
import './SupplierEditor.css';
import { SupplierInput } from '../ReferenceSearch';
import { I18nManager } from 'opuscapita-i18n';
const globalMessages = require('../../../client-server/validatejs/i18n').default;

function isValidDate(d) {
  if (Object.prototype.toString.call(d) !== "[object Date]") {
    return false;
  }
  return !isNaN(d.getTime());
}

// extends standard validator
function getValidator(i18n) {
  validatejs.extend(validatejs.validators.datetime, {
    // The value is guaranteed not to be null or undefined but otherwise it could be anything.
    parse: function(value) {
      let date = new Date(value);
      if (isValidDate(date)) {
        return date.getTime();
      }
      return value.toString;
    },
    // Input is a unix timestamp
    format: function(value) {
      const date = new Date(value);
      if (isValidDate(value)) {
        return i18n.formatDate(date);
      }
      return value;
    }
  });

  return validatejs;
}

@i18n
class SupplierEditorForm extends Component {
  static propTypes = {
    supplier: PropTypes.object,
    onSupplierChange: PropTypes.func.isRequired,
    dateTimePattern: PropTypes.string.isRequired,
    onChange: React.PropTypes.func,
    readOnly: PropTypes.bool,
    countries: PropTypes.array,
    supplierId: PropTypes.string,
    username: React.PropTypes.string,
    actionUrl: React.PropTypes.string.isRequired
  };

  static defaultProps = {
    readOnly: false,
    countries: []
  };

  state = {
    supplier: {
      ...this.props.supplier
    },
    fieldErrors: {},
    isNewSupplier: true
  };

  componentWillReceiveProps(nextProps) {
    if (_.isEqual(this.props.supplier, nextProps.supplier)) {
      return;
    }

    this.setState({
      supplier: {
        ...nextProps.supplier
      },
      fieldErrors: {},
    });
  }

  validatejsI18N = new I18nManager(this.context.i18n.locale, globalMessages)

  SUPPLIER_CONSTRAINTS = {
    supplierName: {
      presence: {
        message: this.validatejsI18N.getMessage('validatejs.blank.message')
      },
      length: {
        maximum: 50,
        tooLong: this.validatejsI18N.getMessage('validatejs.invalid.maxSize.message', {
          limit: 50
        })
      }
    },
    supplierId: {
      presence: {
        message: this.validatejsI18N.getMessage('validatejs.blank.message')
      },
      length: {
        maximum: 50,
        tooLong: this.validatejsI18N.getMessage('validatejs.invalid.maxSize.message', {
          limit: 50
        })
      }
    },
    homePage: {
      presence: false,
      length: {
        maximum: 250,
        tooLong: this.validatejsI18N.getMessage('validatejs.invalid.maxSize.message', {
          limit: 250
        })
      }
    },
    role: {
      presence: {
        message: this.validatejsI18N.getMessage('validatejs.blank.message')
      }
    },
    foundedOn: {
      presence: false,
      datetime: {
        message: this.validatejsI18N.getMessage('validatejs.typeMismatch.java.util.Date')
      }
    },
    legalForm: {
      presence: false,
      length: {
        maximum: 250,
        tooLong: this.validatejsI18N.getMessage('validatejs.invalid.maxSize.message', {
          limit: 250
        })
      }
    },
    registrationNumber: {
      presence: false,
      length: {
        maximum: 250,
        tooLong: this.validatejsI18N.getMessage('validatejs.invalid.maxSize.message', {
          limit: 250
        })
      }
    },
    cityOfRegistration: {
      presence: {
        message: this.validatejsI18N.getMessage('validatejs.blank.message')
      },
      length: {
        maximum: 250,
        tooLong: this.validatejsI18N.getMessage('validatejs.invalid.maxSize.message', {
          limit: 250
        })
      }
    },
    countryOfRegistration: {
      presence: {
        message: this.validatejsI18N.getMessage('validatejs.blank.message')
      },
      length: {
        maximum: 250,
        tooLong: this.validatejsI18N.getMessage('validatejs.invalid.maxSize.message', {
          limit: 250
        })
      }
    },
    taxId: {
      presence: false,
      length: {
        maximum: 250,
        tooLong: this.validatejsI18N.getMessage('validatejs.invalid.maxSize.message', {
          limit: 250
        })
      }
    },
    vatRegNo: {
      presence: false,
      length: {
        maximum: 250,
        tooLong: this.validatejsI18N.getMessage('validatejs.invalid.maxSize.message', {
          limit: 250
        })
      }
    },
    globalLocationNo: {
      presence: false,
      length: {
        maximum: 250,
        tooLong: this.validatejsI18N.getMessage('validatejs.invalid.maxSize.message', {
          limit: 250
        })
      }
    },
    dunsNo: {
      presence: false,
      length: {
        maximum: 250,
        tooLong: this.validatejsI18N.getMessage('validatejs.invalid.maxSize.message', {
          limit: 250
        })
      }
    }
  }

  calculateReadOnly() {
    const {readOnly, username} = this.props;
    return readOnly || (this.state.supplier.createdBy && this.state.supplier.createdBy !== username);
  }

  auditedInfo = () => this.state.supplier.createdBy ?
    <div className="form-group col-sm-6 object-info">
      <p><strong>{this.auditedInfoPart('created')}</strong></p>
      <p><strong>{this.auditedInfoPart('changed')}</strong></p>
    </div> :
    ''

  auditedInfoPart = (fieldName) => {
    const { i18n } = this.context;
    const { supplier } = this.state;
    const dateConverter = new DateConverter(this.props.dateTimePattern, i18n.locale);

    return i18n.getMessage(`SupplierEditor.SupplierEditor.${fieldName}`, {
      by: supplier[`${fieldName}By`],
      on: dateConverter.valueToString(supplier[`${fieldName}On`])
    });
  }

  handleDateChange = (fieldName, event) => {
    let date;
    try {
      date = this.context.i18n.parseDate(event.target.value);
    } catch (e) {
      date = this.state.supplier.foundedOn;
    }

    this.setState({
      supplier: {
        ...this.state.supplier,
        [filedName]: isValidDate(date) ?
          date.toJSON() :
          date || ''
      },
      fieldErrors: {
        ...this.state.fieldErrors,
        [fieldName]: []
      }
    });
  }

  handleChange = (fieldName, event) => {
    let newValue = event.target.value;

    if (this.props.onChange) {
      this.props.onChange(fieldName, this.state.supplier[fieldName], newValue);
    }

    this.setState({
      supplier: {
        ...this.state.supplier,
        [fieldName]: newValue
      }
    });
  }

  handleBlur = (fieldName/* , event*/) => {
    const errors = getValidator(this.context.i18n)(
      this.state.supplier, {
        [fieldName]: this.SUPPLIER_CONSTRAINTS[fieldName]
      }, {
        fullMessages: false
      }
    );

    this.setState({
      fieldErrors: {
        ...this.state.fieldErrors,
        [fieldName]: errors ?
          errors[fieldName].map(msg => ({ message: msg })) :
          []
      }
    });
  }

  handleUpdate = event => {
    event.preventDefault();

    const { supplier } = this.state;
    const { onSupplierChange } = this.props;

    const errors = getValidator(this.context.i18n)(
      supplier,
      this.SUPPLIER_CONSTRAINTS, {
        fullMessages: false
      }
    );

    if (errors) {
      this.setState({
        fieldErrors: Object.keys(errors).reduce((rez, fieldName) => ({
          ...rez,
          [fieldName]: errors[fieldName].map(msg => ({ message: msg }))
        }), {}),
      });

      onSupplierChange(null);
    } else {
      onSupplierChange(supplier);
    }
  };

  renderField = attrs => {
    const { supplier, fieldErrors } = this.state;
    const { fieldName } = attrs;

    let component = attrs.component || <input className="form-control"
      type="text"
      value={ supplier[fieldName] }
      onChange={ this.handleChange.bind(this, fieldName) }
      onBlur={ this.handleBlur.bind(this, fieldName) }
      disabled={ this.calculateReadOnly() }
      autoFocus={ fieldName === 'supplierName' && !this.props.supplierId }
    />;

    return (
      <SupplierEditorFormRow labelText={ this.context.i18n.getMessage(`SupplierEditor.Label.${fieldName}.label`) }
        required={ !!this.SUPPLIER_CONSTRAINTS[fieldName].presence }
        rowErrors={ fieldErrors[fieldName] }
      >
      { component }
      </SupplierEditorFormRow>
    );
  };

  renderSupplierInput() {
    if(this.state.isNewSupplier) {
      return(
        <div className="form-group">
          <label className="col-sm-2 control-label">
            {this.context.i18n.getMessage('SupplierEditor.Label.supplier.label')}
          </label>
          <div className="col-sm-4">
            <SupplierInput serviceRegistry={(serviceName) => {
              return {
                url: this.props.actionUrl
              }
            }}
           value={this.state.supplier.supplierId? {supplierId: this.state.supplier.supplierId} : null}
           onChange={(supplier) => {
             this.setState({
               supplier: supplier? supplier : {}
             })
           }}
           onBlur={() => {this.handleBlur('supplierId')}}/>
            {(() => {
              if(!this.state.isNewSupplier && (!_.isEmpty(this.state.fieldErrors.supplierId) || !_.isEmpty(this.state.fieldErrors.supplierName))) {
                let errorMessage = [].concat(
                  this.state.fieldErrors.supplierId || []
                ).concat(
                  this.state.fieldErrors.supplierName || []
                )[0].message;

                return(
                  <span className="label label-danger">{ errorMessage }</span>
                );
              }
            })()}
          </div>
        </div>
      );
    } else {
      return(
        <div>
          { this.renderField({ fieldName: 'supplierName', readOnly: this.calculateReadOnly() }) }
          { this.renderField({ fieldName: 'supplierId', readOnly: this.calculateReadOnly() }) }
        </div>
      );
    }
  }

  render() {
    const { i18n } = this.context;
    const locale = i18n.locale;
    const { readOnly, countries } = this.props;
    const { supplier } = this.state;

    let foundedOn = supplier['foundedOn'];
    if (foundedOn !== null) {
      let date = new Date(foundedOn);
      if (isValidDate(date)) {
        foundedOn = i18n.formatDate(date);
      }
    }

    return (
      <div>
        <h4 className="tab-description">
          { i18n.getMessage(`SupplierEditor.Description.${
              this.props.supplierId ?
                (this.props.supplier && this.props.supplier.createdBy === this.props.username ?
                  'modifySupplierOrChooseAnother' :
                  'viewSupplierOrChooseAnother'
                ) :
                'chooseSupplier'
            }`)
          }
        </h4>
        <form className="form-horizontal">
          <div className="form-group">
            <label className="control-label col-sm-2">
              {this.context.i18n.getMessage('SupplierEditor.Label.isNewSupplier.label')}
            </label>
            <div className="col-sm-9">
              <div className="checkbox">
                  <input type="checkbox" checked={this.state.isNewSupplier} onChange={() => {
                    this.setState({
                      isNewSupplier: !this.state.isNewSupplier,
                      supplier: {
                        ...this.state.supplier,
                        supplierId: undefined,
                        supplierName: undefined
                      }
                    })
                  }}/>
              </div>
            </div>
          </div>
          {this.renderSupplierInput()}

          { this.renderField({ fieldName: 'homePage', readOnly: this.calculateReadOnly() }) }

          { this.renderField({
            fieldName: 'role',
            readOnly: this.calculateReadOnly(),
            component: (
              <div>
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="buying"
                    checked={ supplier.role === 'buying' }
                    onChange={ this.handleChange.bind(this, 'role') }
                    disabled={this.calculateReadOnly()}
                    className="radio-inline"
                  />
                  <span style={{ fontWeight: 'normal' }}>
                    { this.context.i18n.getMessage('SupplierEditor.Label.buying.label') }
                  </span>
                </label>
                {'\u00a0\u00a0\u00a0\u00a0'}
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="selling"
                    checked={ supplier.role === 'selling' }
                    onChange={ this.handleChange.bind(this, 'role') }
                    disabled={this.calculateReadOnly()}
                    className="radio-inline"
                  />
                  <span style={{ fontWeight: 'normal' }}>
                    { this.context.i18n.getMessage('SupplierEditor.Label.selling.label') }
                  </span>
                </label>
              </div>
            )
          }) }

          { this.renderField({
            fieldName: 'foundedOn',
            readOnly: this.calculateReadOnly(),
            component: (
              <DatePicker className="form-control"
                locale={locale}
                format={i18n.dateFormat}
                disabled={this.calculateReadOnly()}
                value={foundedOn}
                onChange={this.handleDateChange.bind(this, 'foundedOn')}
                onBlur={this.handleBlur.bind(this, 'foundedOn')}
              />
            )
          }) }

          { this.renderField({ fieldName: 'legalForm', readOnly: this.calculateReadOnly() }) }
          { this.renderField({ fieldName: 'registrationNumber', readOnly: this.calculateReadOnly() }) }
          { this.renderField({ fieldName: 'cityOfRegistration', readOnly: this.calculateReadOnly() }) }

          { this.renderField({
            fieldName: 'countryOfRegistration',
            readOnly: this.calculateReadOnly(),
            component: (
              <select className="form-control"
                disabled={this.calculateReadOnly()}
                value={supplier['countryOfRegistration'] || ''}
                onChange={this.handleChange.bind(this, 'countryOfRegistration')}
                onBlur={this.handleBlur.bind(this, 'countryOfRegistration')}
              >
                <option disabled={true} value="">{i18n.getMessage('SupplierEditor.Select.country')}</option>
                {countries.map((country, index) => {
                  return (<option key={index} value={country.id}>{country.name}</option>);
                })}
              </select>
            )
          }) }

          { this.renderField({ fieldName: 'taxId', readOnly: this.calculateReadOnly() }) }
          { this.renderField({ fieldName: 'vatRegNo', readOnly: this.calculateReadOnly() }) }
          { this.renderField({ fieldName: 'globalLocationNo', readOnly: this.calculateReadOnly() }) }
          { this.renderField({ fieldName: 'dunsNo', readOnly: this.calculateReadOnly() }) }

          {!this.calculateReadOnly() && <div className="form-group">
            <div className="text-right col-sm-6">
              <button className="btn btn-primary" onClick={ this.handleUpdate }>
                { i18n.getMessage('SupplierEditor.ButtonLabel.save') }
              </button>
            </div>
          </div>}

          { this.auditedInfo() }
        </form>
      </div>
    );
  }
}

export default SupplierEditorForm;
