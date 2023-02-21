export interface mySqlEventObject
{
    database: String,
    table: String,
    affectedColumns: {
        name:     String,
        charset:  String,
        type:     Number
        metedata: String
      }[],
    changedColumns: {
        name:     String,
        charset:  String,
        type:     Number
        metedata: String
      }[],
      fields: any
    
    }
  