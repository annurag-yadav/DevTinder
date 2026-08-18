// Helper function to normalize strings for comparison
const normalize = (value) => {
    return String(value || "").trim().toLowerCase();
};

// Get common domains
const getCommonDomains = (loggedInUser, candidateUser) => {

    const userDomains = loggedInUser.domains || [];
    const candidateDomains = candidateUser.domains || [];

    const normalizedCandidateDomains =
        candidateDomains.map(normalize);

    return userDomains.filter((domain) =>
        normalizedCandidateDomains.includes(normalize(domain))
    );
};

// Get common skills
const getCommonSkills = (loggedInUser, candidateUser) => {

    const userSkills = loggedInUser.skills || [];
    const candidateSkills = candidateUser.skills || [];

    const normalizedCandidateSkills =
        candidateSkills.map(normalize);

    return userSkills.filter((skill) =>
        normalizedCandidateSkills.includes(normalize(skill))
    );
};


// 1. DOMAIN SCORE - 40 points
const calculateDomainScore = (loggedInUser, candidateUser) => {

    const userDomains = loggedInUser.domains || [];
    const candidateDomains = candidateUser.domains || [];

    if (userDomains.length === 0) {
        return 0;
    }

    const normalizedUserDomains =
        userDomains.map(normalize);

    const normalizedCandidateDomains =
        candidateDomains.map(normalize);

    const commonDomains = normalizedUserDomains.filter(
        (domain) =>
            normalizedCandidateDomains.includes(domain)
    );

    const score =
        (commonDomains.length / userDomains.length) * 40;

    return Math.min(score, 40);
};

// 2. SKILL SCORE - 35 points
const calculateSkillScore = (loggedInUser, candidateUser) => {

    const userSkills = loggedInUser.skills || [];
    const candidateSkills = candidateUser.skills || [];

    if (userSkills.length === 0) {
        return 0;
    }

    const normalizedUserSkills =
        userSkills.map(normalize);

    const normalizedCandidateSkills =
        candidateSkills.map(normalize);

    const commonSkills = normalizedUserSkills.filter(
        (skill) =>
            normalizedCandidateSkills.includes(skill)
    );

    const score =
        (commonSkills.length / userSkills.length) * 35;

    return Math.min(score, 35);
};

// 3. EXPERIENCE SCORE - 10 points
const calculateExperienceScore = (
    loggedInUser,
    candidateUser
) => {

    const userExperience = Number(
        loggedInUser.experienceMonths || 0
    );

    const candidateExperience = Number(
        candidateUser.experienceMonths || 0
    );

    const difference = Math.abs(
        userExperience - candidateExperience
    );

    if (difference <= 6) {
        return 10;
    }

    if (difference <= 12) {
        return 8;
    }

    if (difference <= 24) {
        return 5;
    }

    if (difference <= 48) {
        return 2;
    }

    return 0;
};

// 4. STATUS & ROLE SCORE - 10 points
const calculateStatusRoleScore = (
    loggedInUser,
    candidateUser
) => {

    let score = 0;

    // Same status = 6 points
    if (
        normalize(loggedInUser.currentStatus) !== "" &&
        normalize(loggedInUser.currentStatus) ===
        normalize(candidateUser.currentStatus)
    ) {
        score += 6;
    }

    // Same role = 4 points
    if (
        normalize(loggedInUser.role) !== "" &&
        normalize(loggedInUser.role) ===
        normalize(candidateUser.role)
    ) {
        score += 4;
    }

    return score;
};

// 5. ORGANIZATION SCORE - 5 points
const calculateOrganizationScore = (
    loggedInUser,
    candidateUser
) => {

    const userOrganization = normalize(
        loggedInUser.organization
    );

    const candidateOrganization = normalize(
        candidateUser.organization
    );

    if (
        userOrganization === "" ||
        candidateOrganization === ""
    ) {
        return 0;
    }

    if (
        userOrganization === candidateOrganization
    ) {
        return 5;
    }

    return 0;
};

// FINAL MATCH SCORE
const calculateMatchScore = (
    loggedInUser,
    candidateUser
) => {

    const domainScore = calculateDomainScore(
        loggedInUser,
        candidateUser
    );

    const skillScore = calculateSkillScore(
        loggedInUser,
        candidateUser
    );

    const experienceScore = calculateExperienceScore(
        loggedInUser,
        candidateUser
    );

    const statusRoleScore = calculateStatusRoleScore(
        loggedInUser,
        candidateUser
    );

    const organizationScore =
        calculateOrganizationScore(
            loggedInUser,
            candidateUser
        );

    const totalScore =
        domainScore +
        skillScore +
        experienceScore +
        statusRoleScore +
        organizationScore;

    const finalScore = Number(
        totalScore.toFixed(2)
    );

    return {
        matchScore: finalScore,

        breakdown: {
            domainScore: Number(
                domainScore.toFixed(2)
            ),

            skillScore: Number(
                skillScore.toFixed(2)
            ),

            experienceScore,

            statusRoleScore,

            organizationScore
        }
    };
};

module.exports = {
    calculateDomainScore,
    calculateSkillScore,
    calculateExperienceScore,
    calculateStatusRoleScore,
    calculateOrganizationScore,
    calculateMatchScore,
    getCommonSkills,
    getCommonDomains
};