I-Logix-RPY-Archive version 8.5.2 C++ 2057914
{ IClass
    - someAttr = { IHandle
        - attrB = 3;
        - attrA = 1;
        - empty = "";
        - extra = "extree";
    }
    - attrC = 42;
    - attrD = 17;
    - extraAttr = { IYummmy
        - attrX = 23;
        - attrY = 42;
        - attrZ = "some attr";
    }
    - Things = { IThingList
        - size = 3;
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
            - name = "different";
            - attrE = 11;
            - value = "value2";
        }
        { IThing
            - _id = GUID 3456789A-BCDE-F123-456789ABCDEF;
            - _type = ENUM;
            - name = "thing2";
            - attrE = 22;
            - value = "value3";
        }
    }
}