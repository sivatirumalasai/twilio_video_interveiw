module.exports = (sequelize, Sequelize) => {

    const InterviewMeets = sequelize.define("interview_meets", {
        client_id: Sequelize.INTEGER,
        attendee_id: Sequelize.INTEGER,
        room_id: Sequelize.STRING,
        interview_link: Sequelize.STRING,
        client_status: Sequelize.INTEGER,
        attendee_status: Sequelize.INTEGER,
        status: Sequelize.INTEGER,
        token: Sequelize.STRING,
        interview_date: Sequelize.DATE,
        duration:Sequelize.INTEGER,
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
    }, {
        timestamps: false,
    });

    InterviewMeets.sync({force:true})
    return InterviewMeets;

};