using {cuid } from '@sap/cds/common';

namespace z;

entity ExtDummy: cuid {
  field1: String;
  field2: String;
}

@path: 'ext'
@cds.query.limit.max: 1000
@cds.query.limit.default: 100
service Ext {
  entity ExtDummy as projection on z.ExtDummy;
}
