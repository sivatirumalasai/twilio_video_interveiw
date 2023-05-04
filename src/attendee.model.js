module.exports = (sequelize, Sequelize) => {

    const Attendees = sequelize.define("attendees", {
        first_name: Sequelize.STRING,
        last_name: Sequelize.STRING,
        email: Sequelize.STRING,
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
    }, {
        timestamps: false,
    });
    Attendees.sync({force:true})


    return Attendees;

};