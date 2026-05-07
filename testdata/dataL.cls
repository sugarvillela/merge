I-Logix-RPY-Archive version 8.5.2 C++ 2057914
{ IClass
    - someAttr = { IHandle
        - attrA = 6;
        - attrB = 7;
        - empty = "";
    }
    - attrC = 5;
    - attrD = 7;
    - Things = { IThingList
        - size = 2;
        - value = 
        { IThing 
            - _id = GUID 12345678-9ABC-DEF1-23456789ABCD;
            - _type = BOOL;
            - name = "thing1";
            - attrE = 9;
            - value = "value1";
        }
        { IThing
            - _id = GUID 23456789-ABCD-EF12-3456789ABCDE;
            - _type = ENUM;
            - name = "thing2";
            - attrE = 11;
            - value = "value2";
        }
    }
}