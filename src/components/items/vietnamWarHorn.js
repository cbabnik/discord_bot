

    goodMorningVietnam( metaInfo ) {
        const id = metaInfo.authorId;
        if ( id !== this.get( 'relics.vietnamwarhorn.owner' ) ) {
            this.setAction( 'message', 'You do not possess the vietnam war horn!.' );
            return;
        }
        const date = new Date();
        if ( date.getHours() >= 12 || date.getHours() < 6 ) {
            this.setAction( 'message', 'It\'s not morning' );
            return;
        }
        const day = date.getDate();
        const lastDay = _.get( this.json, 'vietnamDate', -2 );
        if ( day === lastDay ) {
            // can't do it twice in same day
            return;
        }

        let streak = 1;
        let reward = 0;
        if ( day === 1 && lastDay > 27 || day === lastDay+1 ) {
            streak = _.get( this.json,'vietnamStreak', 0 )+1;
        }
        switch ( streak ) {
        case 1: reward = 0; break;
        case 2: reward = 0; break;
        case 3: reward = 0; break;
        case 4: reward = 1; break;
        case 5: reward = 1; break;
        case 6: reward = 1; break;
        case 7: reward = 1; break;
        case 8: reward = 1; break;
        case 9: reward = 2; break;
        case 10: reward = 2; break;
        case 11: reward = 2; break;
        case 12: reward = 2; break;
        case 13: reward = 2; break;
        case 14: reward = -1; break;
        case 15: reward = -1; break;
        case 16: reward = -3; break;
        case 17: reward = -5; break;
        case 18: reward = -7; break;
        case 19: reward = 5; break;
        case 20: reward = 5; break;
        case 21: reward = 5; break;
        case 22: reward = 3; break;
        case 23: reward = 3; break;
        case 24: reward = 3; break;
        case 25: reward = -30; break;
        case 26: reward = 10; break;
        default: reward = 5; break;
        }
        if ( reward < 0 ) {
            if ( !bank.payAmount( id, -reward ) ) {
                this.setAction( 'message', `Today that will cost ${-reward} credits. You don't have enough!` );
                return;
            }
        }

        _.set( this.json,'vietnamDate', day );
        _.set( this.json,'vietnamStreak', streak );

        this.setAction( 'message', `And good morning to you Dion!\n Your streak is ${streak}` );
        if ( reward > 0 ) {
            this.queueAction();
            this.setAction( 'message', `You get ${reward} free credits` );
            bank.addAmount( id, reward );
        }
        if ( reward < 0 ) {
            this.queueAction();
            this.setAction( 'message', `You paid ${-reward} free credits` );
        }
        this.setAction( ACTIONS.IMAGE, `vietnam/vietnam${streak}.jpg` );
    }