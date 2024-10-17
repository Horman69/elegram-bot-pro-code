const { handleFreeLessonRequest } = require('../controllers/welcomeController');
const { courses } = require('../data/courses');

// Мок для Markup
const mockMarkup = {
  keyboard: jest.fn().mockReturnThis(),
  resize: jest.fn().mockReturnThis()
};

jest.mock('telegraf', () => ({
  Markup: {
    keyboard: jest.fn(() => mockMarkup),
    button: {
      contactRequest: jest.fn()
    }
  }
}));

describe('welcomeController', () => {
  describe('handleFreeLessonRequest', () => {
    it('should set up session and send correct message for a specific course', async () => {
      const ctx = {
        answerCbQuery: jest.fn(),
        reply: jest.fn(),
        session: {}
      };
      const courseIndex = 0;

      await handleFreeLessonRequest(ctx, courseIndex);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
      expect(ctx.session.selectedCourse).toBe(courses[courseIndex].title);
      expect(ctx.session.awaitingName).toBe(true);
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining(`Отлично! Вы хотите записаться на пробное занятие по курсу "${courses[courseIndex].title}"`),
        expect.any(Object)
      );
    });

    it('should handle case when no course is selected', async () => {
      const ctx = {
        answerCbQuery: jest.fn(),
        reply: jest.fn(),
        session: {}
      };

      await handleFreeLessonRequest(ctx);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
      expect(ctx.session.selectedCourse).toBe("не выбран");
      expect(ctx.session.awaitingName).toBe(true);
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Отлично! Вы хотите записаться на пробное занятие"),
        expect.any(Object)
      );
    });
  });
});