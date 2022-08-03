using {cuid, managed} from '@sap/cds/common';

context app1.db.monitoring {

  entity Memorys: cuid, managed {
        rss: Integer;
        heapTotal: Integer;
        heapUsed: Integer;
        external: Integer;
        arrayBuffers: Integer;
        /** action that triggered logging the memeoryInfo */
        triggerAction: String;
        elapsedTime   : Decimal(10, 2);
  };
}

