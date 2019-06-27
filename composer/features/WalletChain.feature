#
#  "test": "nyc mocha -t 0 test/*.js && cucumber-js"
#

Feature: Sample

    Background:
        Given I have deployed the business network definition ..
        And I have added the following participants of type org.bana.wallet.UserAccount
            | accountId   | name | cardID |
            | account@alice | Alice     | cardID1        |
            | account@bob   | Bob       | cardID2        |
        And I have added the following assets of type org.bana.wallet.Balance
            | balanceId | account           | value |
            | balance@alice       | account@alice | 10    |
            | balance@bob       | account@bob   | 20    |
        And I have issued the participant org.bana.wallet.UserAccount#account@alice with the identity alice1
        And I have issued the participant org.bana.wallet.UserAccount#account@bob with the identity bob1

    Scenario: Alice can read his balance
        When I use the identity alice1
        Then I should have the following assets of type org.bana.wallet.Balance
            | balanceId | account | value |
            | balance@alice       | account@alice | 10    |

     Scenario: Alice can read Bob's balance
        When I use the identity alice1      
        And I should not have the following asset of type org.bana.wallet.Balance
            | balanceId | account | value |
            | balance@bob       | account@bob | 20    |