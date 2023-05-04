module.exports = (sequelize, Sequelize) => {

    const Clients = sequelize.define("clients", {
        first_name: Sequelize.STRING,
        last_name: Sequelize.STRING,
        company_name: Sequelize.STRING,
        email: Sequelize.STRING,
        status: Sequelize.INTEGER,
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
    }, {
        timestamps: false,
    });
    Clients.sync({force:true})


    return Clients;

};