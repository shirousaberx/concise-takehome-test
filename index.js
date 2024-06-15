const express = require('express');
const { sequelize, User, Group, Task } = require('./models');

const app = express();
app.use(express.json())
app.use(express.urlencoded({extended: true}))

/** 
 * onUpdate and onDelete for tables in relationship follow Sequelize's default
 * https://sequelize.org/docs/v6/core-concepts/assocs/
 */

// =========================== User endpoints ===================================
/**
 * Note: No enforcing email and phone number to be in standard format
 */

// get all users
app.get('/user', async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['id', 'ASC']]
    })
    return res.status(200).json(users)

  } catch (error) {
    res.status(400).json({ message: 'Error fetching all users', error: error.message });
  }
})

// create user
app.post('/user', async (req, res) => {
  console.log('req.body: ', req.body)
  const { name, email, phone_number, address } = req.body

  try {
    const user = await User.create({ name, email, phone_number, address })
    return res.status(200).json(user) // return created user

  } catch (error) {
    res.status(400).json({ message: 'Error creating user', error: error.message });
  }
})

// get user by id (including group where it belongs)
app.get('/user/:userId/group', async (req, res) => {
  const userId = req.params.userId;

  try {
    const usersWithGroups = await User.findAll({
      where: { id: userId },
      include: [{
        model: Group,
        through: { attributes: [] }, // Exclude the junction table attributes
      }],
    });

    if (usersWithGroups.length) {
      return res.status(200).json(usersWithGroups)
    } else {
      res.status(404).json({ message: 'User not found' });
    }

  } catch (error) {
    res.status(400).json({ message: 'Error getting user by id', error: error.message });
  }
})

// get user data by id (complete with task data)
app.get('/user/:userId/task', async (req, res) => {
  const userId = req.params.userId;

  try {
    let user = await User.findByPk(userId, {
      include: [{ model: Task }]
    });
    
    if (user) {
      return res.status(200).json(user)
    }
    
    res.status(404).json({ message: 'User not found' });

  } catch (error) {
    res.status(400).json({ message: 'Error fetching user', error: error.message });
  }
})

// update user by id
app.put('/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  const { name, email, phone_number, address } = req.body;

  try {
    const [affectedRows] = await User.update(
      { name, email, phone_number, address },
      { where: { id: userId } }
    );

    if (affectedRows !== 0) {  
      res.status(200).json({ message: "Successfully updated user" });  
    } else {
      res.status(404).json({ message: 'User not found' });
    }

  } catch (error) {
    return res.status(400).json({ message: "Error updating user by id", message: error.message })
  }
})

// delete user by id
app.delete('/user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const deleted = await User.destroy({
      where: { id: userId }
    });

    if (deleted !== 0) { 
      res.status(200).json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error deleting user', error: error.message });
  }
})

// =========================== Group endpoints ===================================
// get all groups
app.get('/group', async (req, res) => {
  try {
    const groups = await Group.findAll({
      order: [['id', 'ASC']]
    })
    return res.status(200).json(groups)

  } catch (error) {
    res.status(400).json({ message: 'Error fetching all groups', error: error.message });
  }
})

// create group
app.post('/group', async (req, res) => {
  const { name, description } = req.body

  try {
    const group = await Group.create({ name, description })
    return res.status(200).json(group) // return created group

  } catch (error) {
    res.status(400).json({ message: 'Error creating group', error: error.message });
  }
})

// get group data by id (including users in that group)
app.get('/group/:groupId', async (req, res) => {
  const groupId = req.params.groupId;

  try {
    const groupWithUsers = await Group.findAll({
      where: { id: groupId },
      include: [{
        model: User,
        through: { attributes: [] }, // Exclude the junction table attributes
      }],
    });

    if (groupWithUsers.length) {
      return res.status(200).json(groupWithUsers)
    } else {
      res.status(404).json({ message: 'Group not found' });
    }

  } catch (error) {
    res.status(400).json({ message: 'Error getting user by id', error: error.message });
  }
})

// update group by id
app.put('/group/:groupId', async (req, res) => {
  const groupId = req.params.groupId;
  const { name, description } = req.body;

  try {
    const [affectedRows] = await Group.update(
      { name, description },
      { where: { id: groupId } }
    );

    if (affectedRows !== 0) { 
      res.status(200).json({ message: "Successfully updated group "});  
    } else {
      res.status(404).json({ message: 'Group not found' });
    }

  } catch (error) {
    return res.status(400).json({ message: "Error updating group by id", message: error.message })
  }
})

// delete group by id
app.delete('/group/:groupId', async (req, res) => {
  const groupId = req.params.groupId;

  try {
    const deleted = await Group.destroy({
      where: { id: groupId }
    });

    if (deleted !== 0) {
      res.status(200).json({ message: 'Group deleted successfully' });
    } else {
      res.status(404).json({ message: 'Group not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error deleting group', error: error.message });
  }
})

// =========================== Task endpoints ===================================
// create task
app.post('/task', async (req, res) => {
  // use date with timestamp for deadline https://www.postgresql.org/docs/current/datatype-datetime.html
  const { name, deadline } = req.body

  try {
    const task = await Task.create({ name, deadline })
    return res.status(200).json(task) // return created task

  } catch (error) {
    res.status(400).json({ message: 'Error creating task', error: error.message });
  }
})

// update task by id (update user_id here)
app.put('/task/:taskId/user/:userId', async (req, res) => {
  const { userId, taskId } = req.params;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [affectedRows] = await Task.update(
      { UserId: userId },
      { where: { id: taskId }}
    );

    if (affectedRows !== 0) { 
      res.status(200).json({ message: "Successfully updated task on associated user" });
    } else {
      res.status(404).json({ message: "Task not found" })
    }
  } catch (error) {
    res.status(400).json({ message: 'Error creating task for user', error: error.message });
  }
})

// delete task by id
app.delete('/task/:taskId', async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const deleted = await Task.destroy({
      where: { id: taskId }
    });

    if (deleted !== 0) {
      res.status(200).json({ message: 'Task deleted successfully' });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error deleting task', error: error.message });
  }
})

// get task by id (complete with user data who handles the task)
app.get('/task/:taskId', async (req, res) => {
  const taskId = req.params.taskId;

  try {
    let task = await Task.findByPk(taskId);
    
    if (task) {
      task = task.dataValues;   // get the object so we can append user to task object 
      
      if (task.UserId !== null) { // append user to task object if task is already assigned to user
        const user = await User.findByPk(task.UserId);
        task.user = user.dataValues;
      }

      return res.status(200).json(task)
    }
    
    res.status(404).json({ message: 'Task not found' });

  } catch (error) {
    res.status(400).json({ message: 'Error fetching task', error: error.message });
  }
})

// list all tasks
app.get('/task', async (req, res) => {
  try {
    const task = await Task.findAll({
      order: [['id', 'ASC']]
    })
    return res.status(200).json(task)

  } catch (error) {
    res.status(400).json({ message: 'Error fetching all tasks', error: error.message });
  }
})

// =========================== Additional endpoints  ============================
// Add user into group
app.put('/user/:userId/group/:groupId', async (req, res) => {
  const { userId, groupId } = req.params;

  try {
    const user = await User.findByPk(userId);
    const group = await Group.findByPk(groupId);

    if (!user || !group) {
      return res.status(404).json({ message: 'User or Group not found' });
    }

    await user.addGroup(group);

    res.status(200).json({ message: 'User added to group successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error adding user to group', error: error.message });
  }
});

const port = 5000;
app.listen(port, async () => {
  console.log(`Server on http://localhost:${port}`)
  // await sequelize.sync({ force: true })
})
