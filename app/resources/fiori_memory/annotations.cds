using MonitoringService as monitoring from '../../../srv/monitoring-service';

annotate monitoring.Memorys with @(UI : {
    Identification                                        : [{Value : ID}],
    SelectionFields                                       : [triggerAction],
    LineItem                                              : [

        {
            Value : triggerAction,
            Label : '{i18n>triggeraction}'
        },
        {Value : createdAt},
        {Value : rss},
        {Value : heapTotal},
        {Value : heapUsed},
        {Value : elapsedTime}
    ],
    SelectionPresentationVariant #Default : {
        Text                : 'on(De)ActivateExtension',
        $Type               : 'UI.SelectionPresentationVariantType',
        SelectionVariant    : {
            $Type         : 'UI.SelectionVariantType',
            SelectOptions : [{
                PropertyName : triggerAction,
                Ranges       : [
                  {
                      $Type  : 'UI.SelectionRangeType',
                      Sign   : #I,
                      Option : #EQ,
                      Low    : 'onActivateExtensionBefore',
                  },
                  {
                      $Type  : 'UI.SelectionRangeType',
                      Sign   : #I,
                      Option : #EQ,
                      Low    : 'onActivateExtensionAfter',
                  },
                  {
                      $Type  : 'UI.SelectionRangeType',
                      Sign   : #I,
                      Option : #EQ,
                      Low    : 'onDeactivateExtensionBefore',
                  },
                  {
                      $Type  : 'UI.SelectionRangeType',
                      Sign   : #I,
                      Option : #EQ,
                      Low    : 'onDeactivateExtensionAfter',
                  } 
                ],
            }]
        },
        PresentationVariant : {
            $Type          : 'UI.PresentationVariantType',
            SortOrder      : [{
                Property   : createdAt,
                Descending : true
            }],
            Visualizations : ['@UI.LineItem']
        }
    },
    SelectionPresentationVariant #UpgradeBaseModel : {
        Text                : 'onUpgradeBaseModel',
        $Type               : 'UI.SelectionPresentationVariantType',
        SelectionVariant    : {
            $Type         : 'UI.SelectionVariantType',
            SelectOptions : [{
                PropertyName : triggerAction,
                Ranges       : [
                  {
                      $Type  : 'UI.SelectionRangeType',
                      Sign   : #I,
                      Option : #EQ,
                      Low    : 'onUpgradeBaseModelAPIBefore',
                  }, 
                  {
                      $Type  : 'UI.SelectionRangeType',
                      Sign   : #I,
                      Option : #EQ,
                      Low    : 'onUpgradeBaseModelAPIAfter',
                  } 
                ],
            }]
        },
        PresentationVariant : {
            $Type          : 'UI.PresentationVariantType',
            SortOrder      : [{
                Property   : createdAt,
                Descending : true
            }],
            Visualizations : ['@UI.LineItem']
        }
    },
    SelectionPresentationVariant #Chart : {
        Text                : 'Memory Chart',
        $Type               : 'UI.SelectionPresentationVariantType',
        SelectionVariant    : {
            $Type         : 'UI.SelectionVariantType',
            SelectOptions : [{
                PropertyName : triggerAction,
                Ranges       : [{
                    $Type  : 'UI.SelectionRangeType',
                    Sign   : #I,
                    Option : #CP,
                    Low    : 'on*',
                }, ],
            }]
        },
        PresentationVariant : {
            $Type          : 'UI.PresentationVariantType',
            SortOrder      : [{
                Property   : createdAt,
                Descending : true
            }],
            Visualizations : ['@UI.Chart#ChartMemory']
        }
    },
    Chart #ChartMemory                                    : {
        $Type      : 'UI.ChartDefinitionType',
        ChartType  : #Column,
        Title      : 'Memory Consumption',
        Dimensions : [createdAt],
        Measures   : [rss]
    },
    HeaderInfo                                            : {
        TypeName       : '{i18n>memory}',
        TypeNamePlural : '{i18n>memories}',
    }
}
);

annotate monitoring.Memorys with {
    ID            @UI.HiddenFilter;
    triggerAction @title : '{i18n>triggeraction}';
    rss           @title : '{i18n>rss}';
    heapTotal     @title : '{i18n>totalheap}';
    heapUsed      @title : '{i18n>usedheap}';
    elapsedTime   @title : '{i18n>elapsedtime}'; 
};


annotate monitoring.Memorys with @(Aggregation.ApplySupported : {
    GroupableProperties: [createdAt],
    AggregatableProperties: [{
        Property: rss
    }]
});    

